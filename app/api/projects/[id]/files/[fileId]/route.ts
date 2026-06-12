import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { ProjectFile } from "@/models/ProjectFile";
import { apiError, apiOk, isValidObjectId } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id, fileId } = await ctx.params;
  if (!isValidObjectId(id) || !isValidObjectId(fileId))
    return apiError("INVALID_ID", "Invalid id", 400);
  try {
    await getDb();
    const res = await ProjectFile.deleteOne({ _id: fileId, projectId: id });
    if (res.deletedCount === 0) return apiError("FILE_NOT_FOUND", "File not found", 404);
    return apiOk({ ok: true });
  } catch (err) {
    return apiError("FILE_DELETE_FAILED", (err as Error).message, 500);
  }
}
