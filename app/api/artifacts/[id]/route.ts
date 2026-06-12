import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Artifact } from "@/models/Artifact";
import { apiError, apiOk, isValidObjectId } from "@/lib/api";
import { serializeArtifact } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid artifact id", 400);
  try {
    await getDb();
    const artifact = await Artifact.findById(id).lean();
    if (!artifact) return apiError("ARTIFACT_NOT_FOUND", "Artifact not found", 404);
    return apiOk({ artifact: serializeArtifact(artifact) });
  } catch (err) {
    return apiError("ARTIFACT_GET_FAILED", (err as Error).message, 500);
  }
}
