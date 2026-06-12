import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Project } from "@/models/Project";
import { Chat } from "@/models/Chat";
import { apiError, apiOk, readJson } from "@/lib/api";
import { serializeProject } from "@/lib/serialize";
import { DEFAULT_USER_ID, PROJECT_COLORS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
  name?: string;
  description?: string;
  color?: string;
  instructions?: string;
};

export async function POST(req: NextRequest) {
  try {
    await getDb();
    const body = await readJson<CreateBody>(req);
    if (!body.name?.trim()) return apiError("NAME_REQUIRED", "Project name is required", 400);
    const color = (PROJECT_COLORS as readonly string[]).includes(body.color ?? "")
      ? (body.color as string)
      : PROJECT_COLORS[0];
    const project = await Project.create({
      userId: DEFAULT_USER_ID,
      name: body.name.trim().slice(0, 120),
      description: (body.description ?? "").slice(0, 600),
      color,
      instructions: (body.instructions ?? "").slice(0, 8000),
      memory: "",
    });
    return apiOk({ project: serializeProject(project.toObject()) }, { status: 201 });
  } catch (err) {
    return apiError("PROJECT_CREATE_FAILED", (err as Error).message, 500);
  }
}

export async function GET() {
  try {
    await getDb();
    const projects = await Project.find({ userId: DEFAULT_USER_ID })
      .sort({ updatedAt: -1 })
      .lean();
    // Count chats per project for each row.
    const projectIds = projects.map((p) => p._id);
    const counts = await Chat.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: "$projectId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    counts.forEach((c) => countMap.set(String(c._id), c.count));
    return apiOk({
      projects: projects.map((p) => ({
        ...serializeProject(p),
        chatCount: countMap.get(String(p._id)) ?? 0,
      })),
    });
  } catch (err) {
    return apiError("PROJECT_LIST_FAILED", (err as Error).message, 500);
  }
}
