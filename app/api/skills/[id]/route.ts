import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Skill } from "@/models/Skill";
import { apiError, apiOk, isValidObjectId, readJson } from "@/lib/api";
import { serializeSkill } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type PatchBody = {
  name?: string;
  description?: string;
  content?: string;
  enabled?: boolean;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid skill id", 400);
  try {
    await getDb();
    const skill = await Skill.findById(id);
    if (!skill) return apiError("SKILL_NOT_FOUND", "Skill not found", 404);

    const body = await readJson<PatchBody>(req);

    // Builtins: only `enabled` is patchable.
    if (skill.source === "builtin") {
      if (typeof body.enabled === "boolean") skill.enabled = body.enabled;
    } else {
      if (typeof body.name === "string") skill.name = body.name.trim().slice(0, 120);
      if (typeof body.description === "string") skill.description = body.description.slice(0, 600);
      if (typeof body.content === "string") skill.content = body.content.slice(0, 16000);
      if (typeof body.enabled === "boolean") skill.enabled = body.enabled;
    }

    await skill.save();
    return apiOk({ skill: serializeSkill(skill.toObject()) });
  } catch (err) {
    return apiError("SKILL_UPDATE_FAILED", (err as Error).message, 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return apiError("INVALID_ID", "Invalid skill id", 400);
  try {
    await getDb();
    const skill = await Skill.findById(id);
    if (!skill) return apiError("SKILL_NOT_FOUND", "Skill not found", 404);
    if (skill.source === "builtin") {
      return apiError("SKILL_BUILTIN", "Builtin skills cannot be deleted, only disabled.", 403);
    }
    await skill.deleteOne();
    return apiOk({ ok: true });
  } catch (err) {
    return apiError("SKILL_DELETE_FAILED", (err as Error).message, 500);
  }
}
