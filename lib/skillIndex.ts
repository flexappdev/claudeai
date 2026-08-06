import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { SkillDTO, SkillIndexEntry, SkillPlatform } from "@/lib/types";

type SkillDefinition = {
  slug: string;
  name: string;
  description: string;
  content: string;
  platform: SkillPlatform;
  source: string;
  priority: number;
};

const HOME = process.env.HOME || "/home/matsiems";
const WINDOWS_CODEX_ROOT =
  process.env.CODEX_SKILLS_ROOT || "/mnt/c/Users/Mat Siems/.codex";

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  "node_modules",
  "coverage",
  "dist",
  "build",
  "public",
  "archive",
  "_archives",
]);

const PROJECT_ROOTS = ["APPS", "BO", "VIDEOS", "IMAGES"].map((dir) =>
  path.join(HOME, dir),
);

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

async function walkSkillFiles(root: string, maxDepth = 8): Promise<string[]> {
  const files: string[] = [];

  async function visit(dir: string, depth: number) {
    if (depth > maxDepth) return;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(/* turbopackIgnore: true */ dir, {
        withFileTypes: true,
        encoding: "utf8",
      });
    } catch {
      return;
    }

    // Keep traversal bounded. Large parallel directory walks can hit the process
    // file-descriptor ceiling and make an inventory appear to randomly lose skills.
    for (const entry of entries) {
      const full = path.join(/* turbopackIgnore: true */ dir, entry.name);
      if (entry.isFile() && entry.name === "SKILL.md") {
        files.push(full);
        continue;
      }
      if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name)) continue;
      await visit(full, depth + 1);
    }
  }

  await visit(root, 0);
  return files;
}

function classifyFile(file: string): Omit<SkillDefinition, "slug" | "name" | "description" | "content"> | null {
  const normalized = file.replaceAll("\\", "/");

  if (normalized.includes("/context-2026/")) return null;
  if (normalized.includes("/.codex/plugins/cache/")) {
    return { platform: "codex", source: "Codex plugin", priority: 45 };
  }
  if (normalized.includes("/.codex/skills/")) {
    return { platform: "codex", source: "Codex personal", priority: 80 };
  }
  if (normalized.includes("/.agents/skills/")) {
    return { platform: "codex", source: "Project agent", priority: 70 };
  }
  if (normalized.includes("/APPS/skills/skills/")) {
    return { platform: "claudeAi", source: "Anthropic catalog", priority: 55 };
  }
  if (normalized.includes("/.claude/skills/")) {
    const global = normalized.startsWith(`${HOME}/.claude/skills/`);
    return {
      platform: "claudeCode",
      source: global ? "Claude Code global" : "Project Claude",
      priority: global ? 90 : 70,
    };
  }
  if (normalized.includes("/skills/")) {
    return { platform: "claudeCode", source: "Skill repository", priority: 40 };
  }
  return null;
}

async function readDefinition(file: string): Promise<SkillDefinition | null> {
  const classification = classifyFile(file);
  if (!classification) return null;
  try {
    const raw = await fs.readFile(/* turbopackIgnore: true */ file, "utf8");
    const parsed = matter(raw);
    const fallback = path.basename(path.dirname(file));
    const name = String(parsed.data.name || fallback).trim();
    const slug = toSlug(name || fallback);
    if (!slug) return null;
    return {
      ...classification,
      slug,
      name: name || fallback,
      description: String(parsed.data.description || "").trim().replace(/\s+/g, " ").slice(0, 500),
      content: parsed.content.trim(),
    };
  } catch {
    return null;
  }
}

function categoryFor(slug: string, description: string): string {
  const text = `${slug} ${description}`.toLowerCase();
  if (/image|video|remotion|visual|diagram|design|logo|vad|youtube/.test(text)) return "Media";
  if (/doc|pdf|sheet|slide|markdown|research|knowledge/.test(text)) return "Knowledge";
  if (/github|deploy|vercel|release|push|build|test|qa|security|health|env|cleanup|perf/.test(text)) return "Engineering";
  if (/gmail|calendar|drive|slack|notion|connector|supabase|mongo|database|storage|api/.test(text)) return "Integrations";
  if (/agent|master|orchestrat|aibo|appai|abc|ais|persona/.test(text)) return "Agents";
  if (/social|proposal|intake|sector|revenue|affiliate|content|copy/.test(text)) return "Business";
  return "Workflow";
}

async function allFilesystemDefinitions(): Promise<SkillDefinition[]> {
  const directRoots = [
    path.join(HOME, ".claude", "skills"),
    path.join(HOME, ".codex", "skills"),
    path.join(WINDOWS_CODEX_ROOT, "skills"),
    path.join(WINDOWS_CODEX_ROOT, "plugins", "cache"),
  ];
  const fileGroups = await Promise.all([
    ...directRoots.map((root) => walkSkillFiles(root, 7)),
    ...PROJECT_ROOTS.map((root) => walkSkillFiles(root, 8)),
  ]);
  const uniqueFiles = [...new Set(fileGroups.flat())];
  const definitions = await Promise.all(uniqueFiles.map(readDefinition));
  return definitions.filter((skill): skill is SkillDefinition => Boolean(skill));
}

let cache: { at: number; definitions: SkillDefinition[] } | null = null;

async function definitions(): Promise<SkillDefinition[]> {
  if (cache && Date.now() - cache.at < 30_000) return cache.definitions;
  const next = await allFilesystemDefinitions();
  cache = { at: Date.now(), definitions: next };
  return next;
}

export async function buildSkillIndex(appSkills: SkillDTO[]): Promise<{
  skills: SkillIndexEntry[];
  definitions: number;
}> {
  const fileSkills = await definitions();
  const grouped = new Map<string, SkillIndexEntry>();

  for (const skill of fileSkills) {
    const current = grouped.get(skill.slug) || {
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      category: categoryFor(skill.slug, skill.description),
      platforms: { claudeAi: false, claudeCode: false, codex: false },
      sources: [],
      definitions: 0,
      appSkillId: null,
      appEnabled: false,
    };
    current.platforms[skill.platform] = true;
    current.definitions += 1;
    if (!current.sources.includes(skill.source)) current.sources.push(skill.source);
    const previousPriority = Number((current as SkillIndexEntry & { _priority?: number })._priority || 0);
    if (skill.priority > previousPriority) {
      current.name = skill.name;
      current.description = skill.description || current.description;
      (current as SkillIndexEntry & { _priority?: number })._priority = skill.priority;
    }
    grouped.set(skill.slug, current);
  }

  for (const skill of appSkills) {
    const current = grouped.get(skill.slug) || {
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      category: categoryFor(skill.slug, skill.description),
      platforms: { claudeAi: false, claudeCode: false, codex: false },
      sources: [],
      definitions: 0,
      appSkillId: null,
      appEnabled: false,
    };
    current.platforms.claudeAi = true;
    current.appSkillId = skill._id;
    current.appEnabled = skill.enabled;
    current.definitions += 1;
    if (!current.sources.includes("claudeai library")) current.sources.unshift("claudeai library");
    if (!current.description) current.description = skill.description;
    grouped.set(skill.slug, current);
  }

  const skills = [...grouped.values()]
    .map((skill) => {
      delete (skill as SkillIndexEntry & { _priority?: number })._priority;
      return skill;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { skills, definitions: fileSkills.length + appSkills.length };
}

export async function getImportableSkill(slug: string) {
  const matches = (await definitions()).filter((skill) => skill.slug === slug);
  return matches.sort((a, b) => b.priority - a.priority)[0] || null;
}
