import { NextRequest } from "next/server";
import { generateText } from "ai";
import { getDb } from "@/lib/db";
import { Project } from "@/models/Project";
import { Chat } from "@/models/Chat";
import { Message } from "@/models/Message";
import { apiError, apiOk, isValidObjectId } from "@/lib/api";
import { modelFor, isAnthropicConfigured } from "@/lib/anthropic";
import { TITLE_MODEL } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  if (!isAnthropicConfigured()) {
    return apiError("ANTHROPIC_NOT_CONFIGURED", "ANTHROPIC_API_KEY is not set", 500);
  }
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid project id", 400);
  try {
    await getDb();
    const project = await Project.findById(id);
    if (!project) return apiError("PROJECT_NOT_FOUND", "Project not found", 404);

    const chats = await Chat.find({ projectId: id }).sort({ updatedAt: -1 }).limit(20).lean();
    if (chats.length === 0) {
      project.memory = "";
      await project.save();
      return apiOk({ memory: "" });
    }

    // Pull the first user message of each chat for context.
    const firstUserMessages = await Promise.all(
      chats.map(async (c) => {
        const m = await Message.findOne({ chatId: c._id, role: "user" })
          .sort({ createdAt: 1 })
          .lean();
        return { title: c.title, first: m?.content?.slice(0, 400) ?? "" };
      }),
    );

    const transcript = firstUserMessages
      .map((c, i) => `${i + 1}. ${c.title}${c.first ? ` — ${c.first}` : ""}`)
      .join("\n");

    const { text } = await generateText({
      model: modelFor(TITLE_MODEL),
      maxRetries: 2,
      maxOutputTokens: 1024,
      prompt: `You maintain rolling project memory across many conversations.

Project name: ${project.name}
${project.description ? `Description: ${project.description}\n` : ""}
Recent chats (titles + their first user message):
${transcript}

Write a tight ≤300-word rolling memory summarising what the user is working on in this project — recurring themes, decisions made, open threads, terminology they use. Plain prose only, no bullets, no headers, no preamble. Just the summary.`,
    });

    const memory = text.trim().slice(0, 3000);
    project.memory = memory;
    await project.save();
    return apiOk({ memory });
  } catch (err) {
    return apiError("MEMORY_REFRESH_FAILED", (err as Error).message, 500);
  }
}
