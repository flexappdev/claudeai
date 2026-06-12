import { Project } from "@/models/Project";
import { ProjectFile } from "@/models/ProjectFile";
import { isValidObjectId } from "@/lib/api";
import type { ProjectContext } from "@/lib/systemPrompt";

export async function loadProjectContext(
  projectId: string | null | undefined,
): Promise<ProjectContext | null> {
  if (!projectId || !isValidObjectId(String(projectId))) return null;
  const project = await Project.findById(projectId).lean();
  if (!project) return null;
  const files = await ProjectFile.find({ projectId: project._id })
    .sort({ createdAt: 1 })
    .lean();
  return {
    name: project.name,
    instructions: project.instructions,
    memory: project.memory,
    files: files.map((f) => ({ filename: f.filename, content: f.content })),
  };
}
