import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Project } from "@/models/Project";
import { ProjectFile } from "@/models/ProjectFile";
import { apiError, apiOk, isValidObjectId } from "@/lib/api";
import { serializeProjectFile } from "@/lib/serialize";
import { PROJECT_FILE_LIMITS } from "@/lib/constants";
import { parseUploadedFile } from "@/lib/projects/parseFile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid project id", 400);
  try {
    await getDb();
    const project = await Project.findById(id);
    if (!project) return apiError("PROJECT_NOT_FOUND", "Project not found", 404);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return apiError("NO_FILE", "Missing file", 400);

    const count = await ProjectFile.countDocuments({ projectId: id });
    if (count >= PROJECT_FILE_LIMITS.maxFiles) {
      return apiError(
        "FILE_LIMIT",
        `Project has reached the ${PROJECT_FILE_LIMITS.maxFiles}-file cap.`,
        400,
      );
    }

    const parsed = await parseUploadedFile(file);
    const created = await ProjectFile.create({
      projectId: project._id,
      filename: parsed.filename,
      mimeType: parsed.mimeType,
      content: parsed.content,
      size: parsed.size,
    });

    return apiOk({ file: serializeProjectFile(created.toObject()) }, { status: 201 });
  } catch (err) {
    return apiError("FILE_UPLOAD_FAILED", (err as Error).message, 400);
  }
}
