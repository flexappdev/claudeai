import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Project } from "@/models/Project";
import { ProjectFile } from "@/models/ProjectFile";
import { Chat } from "@/models/Chat";
import { apiError, apiOk, isValidObjectId, readJson } from "@/lib/api";
import { serializeProject, serializeProjectFile } from "@/lib/serialize";
import { PROJECT_COLORS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type PatchBody = {
  name?: string;
  description?: string;
  instructions?: string;
  color?: string;
  memory?: string;
};

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid project id", 400);
  try {
    await getDb();
    const project = await Project.findById(id).lean();
    if (!project) return apiError("PROJECT_NOT_FOUND", "Project not found", 404);
    const [files, chats] = await Promise.all([
      ProjectFile.find({ projectId: id }).sort({ createdAt: -1 }).lean(),
      Chat.find({ projectId: id }).sort({ updatedAt: -1 }).lean(),
    ]);
    return apiOk({
      project: serializeProject(project),
      files: files.map(serializeProjectFile),
      chats: chats.map((c) => ({
        _id: String(c._id),
        title: c.title,
        starred: Boolean(c.starred),
        updatedAt: (c.updatedAt as Date).toISOString(),
      })),
    });
  } catch (err) {
    return apiError("PROJECT_GET_FAILED", (err as Error).message, 500);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid project id", 400);
  try {
    await getDb();
    const body = await readJson<PatchBody>(req);
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string") update.name = body.name.trim().slice(0, 120);
    if (typeof body.description === "string") update.description = body.description.slice(0, 600);
    if (typeof body.instructions === "string") update.instructions = body.instructions.slice(0, 8000);
    if (typeof body.memory === "string") update.memory = body.memory.slice(0, 6000);
    if (body.color && (PROJECT_COLORS as readonly string[]).includes(body.color)) update.color = body.color;
    const project = await Project.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!project) return apiError("PROJECT_NOT_FOUND", "Project not found", 404);
    return apiOk({ project: serializeProject(project) });
  } catch (err) {
    return apiError("PROJECT_UPDATE_FAILED", (err as Error).message, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid project id", 400);
  try {
    await getDb();
    await Promise.all([
      ProjectFile.deleteMany({ projectId: id }),
      // Don't delete chats — orphan them by clearing projectId.
      Chat.updateMany({ projectId: id }, { $set: { projectId: null } }),
      Project.deleteOne({ _id: id }),
    ]);
    return apiOk({ ok: true });
  } catch (err) {
    return apiError("PROJECT_DELETE_FAILED", (err as Error).message, 500);
  }
}
