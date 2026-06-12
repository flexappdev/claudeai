import { NextRequest } from "next/server";
import { stepCountIs, streamText, type ModelMessage } from "ai";
import { getDb } from "@/lib/db";
import { Chat } from "@/models/Chat";
import { Message } from "@/models/Message";
import { Artifact } from "@/models/Artifact";
import { apiError, isValidObjectId, readJson } from "@/lib/api";
import { isChatMode, type ChatMode } from "@/lib/chatModes";
import { assembleSystemPrompt } from "@/lib/systemPrompt";
import { modelFor, isAnthropicConfigured } from "@/lib/anthropic";
import { extractArtifacts } from "@/lib/artifacts/parse";
import { loadProjectContext } from "@/lib/projects/context";
import { getEnabledSkills, matchSkills } from "@/lib/skills";
import { buildConnectorTools } from "@/lib/connectors/tools";
import type { ModelId } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type StreamBody = {
  chatId: string;
  message: string;
  mode?: ChatMode;
};

const MAX_HISTORY = 30;

export async function POST(req: NextRequest) {
  if (!isAnthropicConfigured()) {
    return apiError("ANTHROPIC_NOT_CONFIGURED", "ANTHROPIC_API_KEY is not set on the server.", 500);
  }

  const body = await readJson<StreamBody>(req);
  if (!body.chatId || !isValidObjectId(body.chatId)) {
    return apiError("INVALID_CHAT_ID", "chatId is missing or invalid", 400);
  }
  if (!body.message?.trim()) {
    return apiError("EMPTY_MESSAGE", "message is required", 400);
  }
  const mode: ChatMode = isChatMode(body.mode) ? body.mode : "normal";

  try {
    await getDb();
    const chat = await Chat.findById(body.chatId);
    if (!chat) return apiError("CHAT_NOT_FOUND", "Chat not found", 404);

    // Persist user message. If the Mongo cluster is at its collection cap
    // (Atlas shared-tier 500 limit), the very first write to a missing
    // collection throws — degrade gracefully so OpenRouter / Anthropic still
    // stream a response instead of returning 500 for the whole request.
    let persistenceOk = true;
    try {
      await Message.create({
        chatId: chat._id,
        role: "user",
        content: body.message,
        artifactIds: [],
      });
    } catch (err) {
      persistenceOk = false;
      console.warn("[stream] user message persist failed — degraded mode:", (err as Error).message);
    }

    let tail: { role: string; content: string }[] = [];
    try {
      tail = await Message.find({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .limit(MAX_HISTORY)
        .lean();
      tail.reverse();
    } catch {
      // No history available — first turn or persistence broken.
      tail = [{ role: "user", content: body.message }];
    }
    if (tail.length === 0) {
      tail = [{ role: "user", content: body.message }];
    }

    // For history, strip [artifact:id] tokens back into a brief reference so
    // the model still sees something coherent for prior turns.
    const messages: ModelMessage[] = tail.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const [project, enabledSkills, matchedSkills, tools] = await Promise.all([
      loadProjectContext(chat.projectId ? String(chat.projectId) : null),
      getEnabledSkills(),
      matchSkills(body.message),
      buildConnectorTools(),
    ]);
    const system = assembleSystemPrompt({ mode, project, enabledSkills, matchedSkills });

    const hasTools = Object.keys(tools).length > 0;
    const result = streamText({
      model: modelFor(chat.model as ModelId),
      system,
      messages,
      maxRetries: 3,
      ...(hasTools ? { tools, stopWhen: stepCountIs(5) } : {}),
      onFinish: async ({ text }) => {
        if (!persistenceOk) return;
        try {
          const { artifacts, text: tokenized } = extractArtifacts(text);

          // Save the assistant message FIRST so we have a messageId for the artifacts.
          const assistantMessage = await Message.create({
            chatId: chat._id,
            role: "assistant",
            content: tokenized,
            artifactIds: [],
          });

          if (artifacts.length) {
            const ids: typeof assistantMessage._id[] = [];
            for (const a of artifacts) {
              const prior = await Artifact.findOne({ chatId: chat._id, identifier: a.identifier })
                .sort({ version: -1 })
                .lean();
              const version = (prior?.version ?? 0) + 1;
              const saved = await Artifact.create({
                chatId: chat._id,
                messageId: assistantMessage._id,
                identifier: a.identifier,
                title: a.title,
                type: a.type,
                language: a.language,
                content: a.content,
                version,
              });
              ids.push(saved._id);
            }
            assistantMessage.artifactIds = ids;
            await assistantMessage.save();
          }

          chat.updatedAt = new Date();
          await chat.save();

          const count = await Message.countDocuments({ chatId: chat._id });
          if (count === 2 && chat.title === "New chat") {
            void fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:17001"}/api/chats/${chat._id}/title`,
              { method: "POST" },
            ).catch(() => undefined);
          }
        } catch {
          // swallow — already streamed
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return apiError("STREAM_FAILED", (err as Error).message, 500);
  }
}
