// Assembles the system prompt for a given chat. Optional inputs (project +
// skills) are wired here so CC-05 (projects) and CC-06 (skills) can plug in
// without rewriting the streaming route.

import { PROJECT_FILE_LIMITS } from "./constants";
import type { ChatMode } from "./chatModes";

export type ProjectContext = {
  name: string;
  instructions?: string;
  memory?: string;
  files?: { filename: string; content: string }[];
};

export type SkillBrief = {
  slug: string;
  name: string;
  description: string;
};

export type SkillFull = SkillBrief & {
  content: string;
};

export type AssembleInput = {
  mode: ChatMode;
  project?: ProjectContext | null;
  enabledSkills?: SkillBrief[];
  matchedSkills?: SkillFull[];
};

const BASE = `You are Claude, running inside claudeai — a local reproduction of claude.ai built as a Next.js 16 fleet site by Mat Siems. Be helpful, direct, and concise. When the user asks for something concrete, do it without ceremony.

Artifact contract — when you produce a self-contained piece of work (a document, a script, a UI component, a chart) that the user will want to view or re-run, wrap it in:
<artifact identifier="kebab-id" type="code|markdown|html|react|svg|mermaid" title="A clear human title" language="optional-lang-hint">...content...</artifact>

Rules for artifacts:
- Use a stable, kebab-case identifier so updates replace the prior version.
- "react" artifacts are SINGLE-FILE components: write a default export rendering JSX, you may import from "react", "lucide-react" (icon UMD globals), and "recharts" (UMD globals). Tailwind utility classes are available via Tailwind CDN inside the sandbox. Do not assume Node APIs, fs, or any non-browser globals.
- "html" artifacts are complete documents (or fragments wrapped in <body>); they render in a sandboxed iframe.
- "svg" artifacts must be a single <svg>...</svg> root. "mermaid" artifacts are pure Mermaid syntax (no fences).
- "code" artifacts include a "language" attribute. "markdown" artifacts use GFM.
- Use artifacts for substantial, reusable output. For short answers, snippets, or quick fixes, just reply inline with markdown.

Inline code: regular fenced markdown blocks are fine for short examples and explanations.`;

const MODE_BLOCK: Record<ChatMode, string> = {
  normal: "",
  write:
    "Mode: WRITE — favour long-form polished prose. Do not use bullet lists unless the user explicitly asks. Vary sentence rhythm. Land paragraphs cleanly.",
  code:
    "Mode: CODE — favour complete, runnable code. Minimal prose between blocks; lead with the artifact or fenced block, follow with one short paragraph if needed.",
};

export function assembleSystemPrompt(input: AssembleInput): string {
  const parts: string[] = [BASE];
  const mode = MODE_BLOCK[input.mode];
  if (mode) parts.push(mode);

  if (input.project) {
    const p = input.project;
    const projectParts: string[] = [`Project: ${p.name}`];
    if (p.instructions?.trim()) {
      projectParts.push(`Project instructions (apply to every reply in this chat):\n${p.instructions.trim()}`);
    }
    if (p.memory?.trim()) {
      projectParts.push(`Project memory (rolling summary of past chats in this project):\n${p.memory.trim()}`);
    }
    if (p.files?.length) {
      const fileChunks = p.files
        .map((f) => {
          const truncated = f.content.slice(0, PROJECT_FILE_LIMITS.truncateCharsForPrompt);
          const tag = f.content.length > truncated.length ? " (truncated)" : "";
          return `--- ${f.filename}${tag} ---\n${truncated}`;
        })
        .join("\n\n");
      projectParts.push(`Project knowledge files (read-only context):\n${fileChunks}`);
    }
    parts.push(projectParts.join("\n\n"));
  }

  if (input.enabledSkills?.length) {
    const list = input.enabledSkills.map((s) => `- /${s.slug} (${s.name}): ${s.description}`).join("\n");
    parts.push(
      `Available skills (the user can invoke any with "/<slug>" or by name; treat their playbooks as authoritative when invoked):\n${list}`,
    );
  }

  if (input.matchedSkills?.length) {
    const blocks = input.matchedSkills
      .map((s) => `### Skill: ${s.name} (/${s.slug})\n${s.description}\n\n${s.content}`)
      .join("\n\n");
    parts.push(`Matched skill playbooks for this message — follow them faithfully:\n\n${blocks}`);
  }

  return parts.join("\n\n---\n\n");
}
