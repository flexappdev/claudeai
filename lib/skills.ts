import { Skill } from "@/models/Skill";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { serializeSkill } from "@/lib/serialize";
import type { SkillBrief, SkillFull } from "@/lib/systemPrompt";

const MAX_MATCHED = 2;

export async function getEnabledSkills(userId = DEFAULT_USER_ID): Promise<SkillBrief[]> {
  const docs = await Skill.find({ userId, enabled: true }).lean();
  return docs.map((s) => ({
    slug: String(s.slug),
    name: String(s.name),
    description: String(s.description ?? ""),
  }));
}

/**
 * Match enabled skills against the user's message.
 * v1 rules (simple):
 *   - explicit invocation: message contains `/<slug>` (word boundary)
 *   - implicit: message contains any whole-word from the skill name
 * Cap: at most 2 full-content injections per message.
 */
export async function matchSkills(
  message: string,
  userId = DEFAULT_USER_ID,
): Promise<SkillFull[]> {
  const docs = await Skill.find({ userId, enabled: true }).lean();
  const lower = message.toLowerCase();

  type Scored = { skill: SkillFull; score: number };
  const scored: Scored[] = [];

  for (const s of docs) {
    const slug = String(s.slug);
    const name = String(s.name);
    let score = 0;
    if (new RegExp(`(^|\\W)/${escapeRegExp(slug)}\\b`, "i").test(message)) score += 10;
    for (const word of name.split(/\s+/).filter((w) => w.length >= 3)) {
      const re = new RegExp(`(^|\\W)${escapeRegExp(word.toLowerCase())}(\\W|$)`);
      if (re.test(lower)) score += 1;
    }
    if (score > 0) {
      const ser = serializeSkill(s);
      scored.push({
        skill: {
          slug: ser.slug,
          name: ser.name,
          description: ser.description,
          content: ser.content,
        },
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_MATCHED).map((s) => s.skill);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toKebab(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
