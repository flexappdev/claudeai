import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Chat } from "@/models/Chat";
import { apiError, apiOk, readJson } from "@/lib/api";
import { serializeChat } from "@/lib/serialize";
import { DEFAULT_MODEL, DEFAULT_USER_ID, MODELS, type ModelId } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = { title?: string; model?: ModelId; projectId?: string | null };

const MAX_LIMIT = 50;
const validModels = new Set(MODELS.map((m) => m.id));

export async function POST(req: NextRequest) {
  try {
    await getDb();
    const body = await readJson<CreateBody>(req);
    const model = body.model && validModels.has(body.model) ? body.model : DEFAULT_MODEL;
    const chat = await Chat.create({
      userId: DEFAULT_USER_ID,
      title: body.title?.trim() || "New chat",
      model,
      projectId: body.projectId || null,
      starred: false,
    });
    return apiOk({ chat: serializeChat(chat.toObject()) }, { status: 201 });
  } catch (err) {
    return apiError("CHAT_CREATE_FAILED", (err as Error).message, 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    await getDb();
    const url = new URL(req.url);
    const q = Object.fromEntries(url.searchParams.entries());
    const limit = Math.min(Math.max(parseInt(q.limit || "20", 10) || 20, 1), MAX_LIMIT);

    const filter: Record<string, unknown> = { userId: DEFAULT_USER_ID };
    if (q.projectId) filter.projectId = q.projectId;
    if (q.starred === "true") filter.starred = true;
    if (q.q) filter.title = { $regex: q.q, $options: "i" };
    if (q.cursor) filter.updatedAt = { $lt: new Date(q.cursor) };

    const docs = await Chat.find(filter).sort({ updatedAt: -1 }).limit(limit + 1).lean();
    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;
    const last = slice[slice.length - 1];
    const nextCursor =
      hasMore && last && last.updatedAt instanceof Date ? last.updatedAt.toISOString() : null;

    return apiOk({
      chats: slice.map(serializeChat),
      nextCursor,
    });
  } catch (err) {
    return apiError("CHAT_LIST_FAILED", (err as Error).message, 500);
  }
}
