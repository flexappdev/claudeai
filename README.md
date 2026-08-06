# claudeai

> Reproduce claude.ai as a Next.js 16 fleet site — chat, projects, artifacts, skills, connectors. Siemens-blue (Mat Siems brand).

[![Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-private-lightgrey)](#license)

**Port:** `17001` · **Repo:** [`flexappdev/claudeai`](https://github.com/flexappdev/claudeai) · **Fleet rank:** 28 · **Accent:** `#006699` (Siemens blue)

---

## What it is

A local single-user reproduction of claude.ai built as one of the 23 fleet sites under `~/APPS/`. Everything claude.ai does — chat with streaming, artifacts in a split-screen panel, projects with knowledge files, skills (playbooks), and Google + Slack connectors with tool use — running on the Anthropic Messages API via the Vercel AI SDK against MongoDB Atlas.

v1 is single-user (every model carries `userId: "mat"` for forward-compat) and uses no Supabase / no auth wall.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Streaming | Vercel AI SDK 6 (`ai` + `@ai-sdk/anthropic`) |
| LLM | Anthropic Messages API — Claude Sonnet 4.6 default, Haiku 4.5 for titles/memory |
| Data | MongoDB Atlas + Mongoose 8 |
| Style | Tailwind v4 CSS-config (`@theme inline`) + Inter / Source Serif 4 / JetBrains Mono |
| Icons | lucide-react |
| Connectors | googleapis + @slack/web-api with AES-256-GCM token encryption |
| Deploy | Vercel (matsiems team) |

## Features (CC-01..CC-09)

- **CC-01 scaffold-shell** — Next 16 + Tailwind v4, design system in `app/globals.css`, collapsible 280↔64px sidebar, no-flash theme toggle, 7 Mongoose models, cached connection helper.
- **CC-02 chats-crud** — full chat lifecycle (create / rename / star / move-to-project / delete with cascade), markdown rendering with sugar-high syntax highlight, debounced searchable `/recents` grouped by date.
- **CC-03 chat-streaming** — token-streamed replies via `streamText` + auto-title via Haiku + Normal / Write / Code mode toggle persisted per chat.
- **CC-04 artifacts** — streaming-safe `<artifact>` parser, versioned upserts by identifier, split-screen 45/55 desktop layout, sandboxed iframe (React 19 + Babel + Tailwind CDN + lucide + recharts UMD) for `html` / `react`, inline `svg`, dynamic-import `mermaid`, full `/artifacts` gallery.
- **CC-05 projects** — CRUD + .md/.txt/.csv/.json/.pdf upload (200KB×10 cap), per-project instructions + Haiku-summarised rolling memory, project context injected into the system prompt of every chat scoped to that project.
- **CC-06 skills** — 4 builtin playbooks (PRD, Proposal, Sprint, Status report) seeded on first visit; user-created skills via frontmatter `SKILL.md` upload; `/<slug>` invocation injects full playbook body, plain mentions inject only the brief.
- **CC-07 connectors** — Gmail / Drive / Sheets / Slack OAuth with refresh-token plumbing and AES-256-GCM at-rest encryption; 8 AI-SDK tools registered conditionally; `stopWhen: stepCountIs(5)`; "Not configured" pills when env vars are absent.
- **CC-08 polish-v1** — Cmd+K command palette across chats / projects / skills + actions, Cmd+Shift+O new chat, Esc closes artifact panel, sonner toasts, metadata title template, GA4 wrapper ready for `/abc-ga sync`.
- **CC-09 Skills OS** — live, read-only discovery across global Claude Code, project-local Claude, personal Codex, Codex plugin, agent, and Anthropic catalogue roots; canonical slug deduplication; platform/category/search filters; one-click import + activation in claudeai; prepared skill chats; native Claude Code and Codex invocation copying. Private context roots are explicitly excluded.

## Quickstart

```bash
git clone https://github.com/flexappdev/claudeai.git ~/APPS/claudeai
cd ~/APPS/claudeai
cp .env.local.example .env.local
# fill MONGODB_URI + ANTHROPIC_API_KEY at minimum
npm install
npm run dev
# → http://localhost:17001
```

## Env vars

| var | required | what it does |
|---|---|---|
| `MONGODB_URI` | yes | Mongoose connection string |
| `MONGODB_DB` | no (default `claudeai`) | Database name |
| `ANTHROPIC_API_KEY` | yes (CC-03+) | Streaming + auto-title + memory + tool use |
| `NEXT_PUBLIC_APP_URL` | yes (CC-07) | OAuth redirect base (`http://localhost:17001` dev, prod Vercel URL) |
| `CONNECTOR_SECRET` | for connectors | 32-byte hex; encrypts OAuth tokens at rest (`openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Gmail / Drive / Sheets | OAuth credentials from Google Cloud Console |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | for Slack | OAuth credentials from Slack app config |
| `NEXT_PUBLIC_GA_ID` | optional | GA4 measurement id (`G-XXXXXXXXXX`) — activated via `/abc-ga sync claudeai` |

If `*_CLIENT_ID`/`*_CLIENT_SECRET` are absent, the connector card surfaces a "Not configured" pill and the rest of the app works normally.

## Scripts

```bash
npm run dev          # next dev -p 17001 (Turbopack)
npm run build        # NODE_OPTIONS=--max-old-space-size=4096 next build
npm run start        # production serve on 17001
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

## Architecture

```
app/
├── api/
│   ├── chat/stream/       streamText pipe → onFinish persists message + artifacts
│   ├── chats/             CRUD + auto-title
│   ├── artifacts/         GET latest + GET versions
│   ├── projects/          CRUD + files (multipart) + memory refresh
│   ├── skills/            CRUD + seed (builtins)
│   └── connectors/        google/slack OAuth auth + callback, [key] DELETE + ping
├── chat/[id]/             split-screen (chat 45% / artifact panel 55% on desktop)
├── recents/               searchable history grouped by date
├── projects/, projects/[id]/   gallery + 3-tab detail
├── artifacts/, artifacts/[id]/ gallery + full-width viewer
├── customize/skills/      Skills OS — unified Claude.ai / Claude Code / Codex command deck
├── customize/connectors/  card per service with Connect / Test / Disconnect
└── settings/              theme + default model
components/
├── shell/                 Sidebar, ThemeProvider (no-flash), ThemeToggle
├── chat/                  ChatHeader, Composer, MessageList, MessageBubble, Markdown
├── artifacts/             ArtifactCard, ArtifactPanel, VersionPicker
├── projects/              ProjectCard, NewProjectModal, FileDropzone, InstructionsEditor, MemoryCard
├── skills/                SkillCard, SkillDrawer, SkillEditorModal
├── connectors/            ConnectorCard, ToolCallChip
└── ui/                    Skeleton, EmptyState, CommandPalette
lib/
├── db.ts                  cached mongoose
├── systemPrompt.ts        prompt assembler (mode + project + skills)
├── anthropic.ts           model factory
├── artifacts/             parse.ts (streaming-safe) + reactHarness.ts (iframe srcdoc)
├── projects/              context loader + multipart parser (pdf-parse v2)
├── connectors/            crypto + google + slack + tools (8 AI-SDK tools)
├── skills.ts              enabled briefs + matched-body injection
├── skillIndex.ts          bounded filesystem scan + canonical cross-platform registry
└── builtinSkills.ts       4 real playbooks (PRD, Proposal, Sprint, Status)
models/                    7 Mongoose schemas with indexes
docs/
├── BUILD-PLAN.md          original 8-session CC prompt pack
└── GOAL.md                checkboxed acceptance + ship checklist
```

## Build + deploy (ABC fleet pattern)

```bash
# sync env from central
/abc-mongo sync claudeai          # writes MONGODB_URI from ~/context-2026/agents/.env

# push secrets to GitHub Actions
/abc-github sync claudeai

# Vercel — matsiems team
/abc-vercel claudeai              # link + env push + vercel --prod

# turn on analytics (optional, only if a G- id exists)
/abc-ga sync claudeai G-XXXXXXXXXX
```

After the first prod deploy: update the OAuth redirect URIs in the Google + Slack consoles to point at the new Vercel URL (`https://claudeai-XXXX.vercel.app/api/connectors/{google,slack}/callback`).

## Routing safety

This repo is one of 23 fleet sites under `~/APPS/`. The cockpit (`~/APPS/appai/`) auto-discovers it via the rank-28 entry in `~/APPS/apps-registry.json`. Edits to "the chat UI", "the brand colour", "the home page" of claudeai always belong **here**, not in the cockpit.

## v1 exclusions (deferred)

Auth / multi-user, voice, web-search tool, image upload to chat, Research mode, billing. Each is a future CC session. The `userId` field on every model + the `systemPrompt` assembly function are the only seams future sessions need.

## License

Private — part of Mat Siems' ABC (Apps + Backoffice + Context) fleet for 1G 2026.
