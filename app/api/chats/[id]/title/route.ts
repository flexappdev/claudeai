import { NextRequest } from "next/server";
import { generateText } from "ai";
import { getDb } from "@/lib/db";
import { Chat } from "@/models/Chat";
import { Message } from "@/models/Message";
import { apiError, apiOk, isValidObjectId } from "@/lib/api";
import { modelFor, isAnthropicConfigured } from "@/lib/anthropic";
import { TITLE_MODEL } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  if (!isAnthropicConfigured()) {
    return apiError("ANTHROPIC_NOT_CONFIGURED", "ANTHROPIC_API_KEY is not set", 500);
  }
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid chat id", 400);

  try {
    await getDb();
    const chat = await Chat.findById(id);
    if (!chat) return apiError("CHAT_NOT_FOUND", "Chat not found", 404);

    const recent = await Message.find({ chatId: id }).sort({ createdAt: 1 }).limit(4).lean();
    if (recent.length === 0) return apiOk({ title: chat.title });

    const transcript = recent
      .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${m.content.slice(0, 600)}`)
      .join("\n\n");

    const { text } = await generateText({
      model: modelFor(TITLE_MODEL),
      maxRetries: 2,
      maxOutputTokens: 256,
      prompt: `Summarise this conversation as a 3-6 word title, plain text only, no quotes, no trailing punctuation:\n\n${transcript}`,
    });

    const title = text
      .trim()
      .replace(/^[`'"\s]+|[`'"\s.]+$/g, "")
      .slice(0, 80);
    if (!title) return apiOk({ title: chat.title });

    chat.title = title;
    await chat.save();
    return apiOk({ title });
  } catch (err) {
    return apiError("TITLE_FAILED", (err as Error).message, 500);
  }
}
