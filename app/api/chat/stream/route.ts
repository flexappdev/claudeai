import { NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { getDb } from "@/lib/db";
import { Chat } from "@/models/Chat";
import { Message } from "@/models/Message";
import { apiError, isValidObjectId, readJson } from "@/lib/api";
import { isChatMode, type ChatMode } from "@/lib/chatModes";
import { assembleSystemPrompt } from "@/lib/systemPrompt";
import { modelFor, isAnthropicConfigured } from "@/lib/anthropic";
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

    // Persist the user message immediately so refreshes see it.
    await Message.create({
      chatId: chat._id,
      role: "user",
      content: body.message,
      artifactIds: [],
    });

    // Load tail history (already includes the user message we just wrote).
    const tail = await Message.find({ chatId: chat._id })
      .sort({ createdAt: -1 })
      .limit(MAX_HISTORY)
      .lean();
    tail.reverse();

    const messages: ModelMessage[] = tail.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const system = assembleSystemPrompt({ mode });

    const result = streamText({
      model: modelFor(chat.model as ModelId),
      system,
      messages,
      maxRetries: 3,
      onFinish: async ({ text }) => {
        try {
          await Message.create({
            chatId: chat._id,
            role: "assistant",
            content: text,
            artifactIds: [],
          });
          chat.updatedAt = new Date();
          await chat.save();

          // Auto-title after the first assistant reply.
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
