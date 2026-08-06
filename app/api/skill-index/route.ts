import { getDb } from "@/lib/db";
import { apiError, apiOk, readJson } from "@/lib/api";
import { buildSkillIndex, getImportableSkill } from "@/lib/skillIndex";
import { serializeSkill } from "@/lib/serialize";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { Skill } from "@/models/Skill";
import { SkillIndexSnapshot } from "@/models/SkillIndexSnapshot";
import type { SkillDTO, SkillIndexEntry, SkillPlatform } from "@/lib/types";

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
    const hasFilesystemSkills = index.definitions > app.skills.length;
    if (!hasFilesystemSkills && app.connected) {
      const snapshot = await SkillIndexSnapshot.findOne({ key: "master" }).lean();
      if (snapshot?.skills.length) {
        const appBySlug = new Map(app.skills.map((skill) => [skill.slug, skill]));
        const skills = snapshot.skills.map((skill) => {
          const current = appBySlug.get(skill.slug);
          if (!current) return skill;
          return {
            ...skill,
            platforms: { ...skill.platforms, claudeAi: true },
            appSkillId: current._id,
            appEnabled: current.enabled,
          };
        });
        return apiOk({
          skills,
          definitions: snapshot.definitions,
          databaseConnected: true,
          snapshot: true,
          scannedAt: snapshot.scannedAt.toISOString(),
        });
      }
    }
    return apiOk({
      ...index,
      databaseConnected: app.connected,
      snapshot: false,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    return apiError("SKILL_INDEX_FAILED", (err as Error).message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      action?: string;
      slug?: string;
      skills?: SkillIndexEntry[];
      definitions?: number;
    }>(req);

    if (body.action === "sync") {
      if (!isSyncAuthorized(req)) return apiError("SYNC_FORBIDDEN", "Not authorized", 403);
      if (!Array.isArray(body.skills) || body.skills.length > 2_000) {
        return apiError("INVALID_SNAPSHOT", "A valid skill snapshot is required", 400);
      }
      const skills = body.skills.map(sanitizeSnapshotSkill).filter(Boolean) as SkillIndexEntry[];
      if (!skills.length) return apiError("EMPTY_SNAPSHOT", "Snapshot cannot be empty", 400);
      const definitions = Math.max(skills.length, Number(body.definitions) || skills.length);
      const scannedAt = new Date();
      await getDb();
      await SkillIndexSnapshot.findOneAndUpdate(
        { key: "master" },
        { key: "master", skills, definitions, scannedAt },
        { upsert: true, new: true },
      );
      return apiOk({ ok: true, skills: skills.length, definitions, scannedAt: scannedAt.toISOString() });
    }

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

function isSyncAuthorized(req: Request) {
  const expected = process.env.CONNECTOR_SECRET;
  const provided = req.headers.get("x-sync-secret");
  return Boolean(expected && provided && expected === provided);
}

const platforms: SkillPlatform[] = ["claudeAi", "claudeCode", "codex"];

function sanitizeSnapshotSkill(value: SkillIndexEntry): SkillIndexEntry | null {
  const slug = String(value?.slug || "").trim();
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)) return null;
  const available = Object.fromEntries(
    platforms.map((platform) => [platform, Boolean(value.platforms?.[platform])]),
  ) as Record<SkillPlatform, boolean>;
  return {
    slug,
    name: String(value.name || slug).slice(0, 120),
    description: String(value.description || "").slice(0, 500),
    category: String(value.category || "Workflow").slice(0, 40),
    platforms: available,
    sources: Array.isArray(value.sources)
      ? value.sources.map((source) => String(source).slice(0, 80)).slice(0, 12)
      : [],
    definitions: Math.max(1, Number(value.definitions) || 1),
    appSkillId: null,
    appEnabled: false,
  };
}
