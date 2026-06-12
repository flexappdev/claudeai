import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Skill } from "@/models/Skill";
import { apiError, apiOk, readJson } from "@/lib/api";
import { serializeSkill } from "@/lib/serialize";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { toKebab } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
  name?: string;
  slug?: string;
  description?: string;
  content?: string;
  enabled?: boolean;
};

export async function GET() {
  try {
    await getDb();
    const skills = await Skill.find({ userId: DEFAULT_USER_ID }).sort({ source: 1, name: 1 }).lean();
    return apiOk({ skills: skills.map(serializeSkill) });
  } catch (err) {
    return apiError("SKILL_LIST_FAILED", (err as Error).message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await getDb();
    const body = await readJson<CreateBody>(req);
    if (!body.name?.trim()) return apiError("NAME_REQUIRED", "name is required", 400);
    const slug = body.slug?.trim() ? toKebab(body.slug) : toKebab(body.name);
    if (!slug) return apiError("INVALID_SLUG", "Could not derive a slug", 400);
    const existing = await Skill.findOne({ slug });
    if (existing) return apiError("SLUG_EXISTS", `Skill with slug "${slug}" already exists`, 409);
    const skill = await Skill.create({
      userId: DEFAULT_USER_ID,
      slug,
      name: body.name.trim().slice(0, 120),
      description: (body.description ?? "").slice(0, 600),
      content: (body.content ?? "").slice(0, 16000),
      enabled: Boolean(body.enabled),
      source: "user",
    });
    return apiOk({ skill: serializeSkill(skill.toObject()) }, { status: 201 });
  } catch (err) {
    return apiError("SKILL_CREATE_FAILED", (err as Error).message, 500);
  }
}
