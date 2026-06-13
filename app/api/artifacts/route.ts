import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { getDb } from "@/lib/db";
import { Artifact } from "@/models/Artifact";
import { apiError, apiOk, isValidObjectId } from "@/lib/api";
import { serializeArtifact } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await getDb();
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    const filter: Record<string, unknown> = {};
    if (chatId) {
      if (!isValidObjectId(chatId)) return apiError("INVALID_CHAT_ID", "Invalid chatId", 400);
      // Aggregate $match needs an ObjectId here — Mongoose only auto-coerces in find().
      filter.chatId = new Types.ObjectId(chatId);
    }

    // Latest version per (chatId, identifier).
    const docs = await Artifact.aggregate([
      { $match: filter },
      { $sort: { version: -1 } },
      { $group: { _id: { chatId: "$chatId", identifier: "$identifier" }, doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { createdAt: -1 } },
    ]);

    return apiOk({ artifacts: docs.map(serializeArtifact) });
  } catch (err) {
    return apiError("ARTIFACT_LIST_FAILED", (err as Error).message, 500);
  }
}
