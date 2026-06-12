import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Chat } from "@/models/Chat";
import { Message } from "@/models/Message";
import { Artifact } from "@/models/Artifact";
import { apiError, apiOk, isValidObjectId, readJson } from "@/lib/api";
import { serializeChat, serializeMessage } from "@/lib/serialize";
import { MODELS, type ModelId } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type PatchBody = { title?: string; starred?: boolean; projectId?: string | null; model?: ModelId };

const validModels = new Set(MODELS.map((m) => m.id));

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid chat id", 400);
  try {
    await getDb();
    const chat = await Chat.findById(id).lean();
    if (!chat) return apiError("CHAT_NOT_FOUND", "Chat not found", 404);
    const messages = await Message.find({ chatId: id }).sort({ createdAt: 1 }).lean();
    return apiOk({
      chat: serializeChat(chat),
      messages: messages.map(serializeMessage),
    });
  } catch (err) {
    return apiError("CHAT_GET_FAILED", (err as Error).message, 500);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid chat id", 400);
  try {
    await getDb();
    const body = await readJson<PatchBody>(req);
    const update: Record<string, unknown> = {};
    if (typeof body.title === "string") update.title = body.title.trim().slice(0, 200) || "New chat";
    if (typeof body.starred === "boolean") update.starred = body.starred;
    if ("projectId" in body) update.projectId = body.projectId || null;
    if (body.model && validModels.has(body.model)) update.model = body.model;

    const chat = await Chat.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!chat) return apiError("CHAT_NOT_FOUND", "Chat not found", 404);
    return apiOk({ chat: serializeChat(chat) });
  } catch (err) {
    return apiError("CHAT_UPDATE_FAILED", (err as Error).message, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid chat id", 400);
  try {
    await getDb();
    const chat = await Chat.findById(id).lean();
    if (!chat) return apiError("CHAT_NOT_FOUND", "Chat not found", 404);
    await Promise.all([
      Message.deleteMany({ chatId: id }),
      Artifact.deleteMany({ chatId: id }),
      Chat.deleteOne({ _id: id }),
    ]);
    return apiOk({ ok: true });
  } catch (err) {
    return apiError("CHAT_DELETE_FAILED", (err as Error).message, 500);
  }
}
