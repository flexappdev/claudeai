import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Skill } from "@/models/Skill";
import { apiError, apiOk } from "@/lib/api";
import { BUILTIN_SKILLS } from "@/lib/builtinSkills";
import { DEFAULT_USER_ID } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  try {
    await getDb();
    let upserted = 0;
    for (const s of BUILTIN_SKILLS) {
      const res = await Skill.findOneAndUpdate(
        { slug: s.slug },
        {
          $set: {
            name: s.name,
            description: s.description,
            content: s.content,
            source: "builtin",
            userId: DEFAULT_USER_ID,
          },
          $setOnInsert: { enabled: false },
        },
        { upsert: true, new: true },
      );
      if (res) upserted++;
    }
    return apiOk({ ok: true, upserted });
  } catch (err) {
    return apiError("SEED_FAILED", (err as Error).message, 500);
  }
}
