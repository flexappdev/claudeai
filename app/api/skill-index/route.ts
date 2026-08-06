import { getDb } from "@/lib/db";
import { apiError, apiOk, readJson } from "@/lib/api";
import { buildSkillIndex, getImportableSkill } from "@/lib/skillIndex";
import { serializeSkill } from "@/lib/serialize";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { Skill } from "@/models/Skill";
import type { SkillDTO } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function appSkills(): Promise<{ skills: SkillDTO[]; connected: boolean }> {
  try {
    await getDb();
    const rows = await Skill.find({ userId: DEFAULT_USER_ID }).sort({ name: 1 }).lean();
    return { skills: rows.map(serializeSkill), connected: true };
  } catch {
    return { skills: [], connected: false };
  }
}

export async function GET() {
  try {
    const app = await appSkills();
    const index = await buildSkillIndex(app.skills);
    return apiOk({ ...index, databaseConnected: app.connected, scannedAt: new Date().toISOString() });
  } catch (err) {
    return apiError("SKILL_INDEX_FAILED", (err as Error).message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson<{ slug?: string }>(req);
    const slug = String(body.slug || "").trim();
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)) {
      return apiError("INVALID_SLUG", "A valid skill slug is required", 400);
    }

    await getDb();
    const existing = await Skill.findOne({ userId: DEFAULT_USER_ID, slug });
    if (existing) {
      existing.enabled = true;
      await existing.save();
      return apiOk({ skill: serializeSkill(existing.toObject()), imported: false });
    }

    const definition = await getImportableSkill(slug);
    if (!definition) return apiError("SKILL_NOT_FOUND", "Skill definition not found", 404);
    const content = definition.content.slice(0, 16_000);
    const skill = await Skill.create({
      userId: DEFAULT_USER_ID,
      slug,
      name: definition.name.slice(0, 120),
      description: definition.description.slice(0, 600),
      content,
      enabled: true,
      source: "user",
    });
    return apiOk({ skill: serializeSkill(skill.toObject()), imported: true }, { status: 201 });
  } catch (err) {
    return apiError("SKILL_IMPORT_FAILED", (err as Error).message, 500);
  }
}
