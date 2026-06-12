# claudeai — CC Prompt Pack

Reproduce claude.ai as a Next.js 16 app called **claudeai**.
8 CC sessions, ordered by dependency. Paste each block into Claude Code cold.

**Global stack (applies to every session):**
Next.js 16 App Router, React 19, TypeScript strict, MongoDB Atlas + Mongoose, Tailwind CSS, Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) for streaming, Anthropic Messages API (`claude-sonnet-4-6` default model), lucide-react icons, deployed to Vercel.

**Design system (claude.ai layout, Siemens-branded):**
- Light: paper `#F4F3EE`, surface `#FFFFFF`, text `#1A1915`
- Dark: bg `#262624`, surface `#30302E`, text `#F5F4EF`
- Accent: Siemens blue `#006699` (hover `#005580`, light tint `rgba(0,102,153,0.10)` for selected states, focus ring `rgba(0,102,153,0.35)`)
- On-accent text: always `#FFFFFF`; dark mode accent lifts to `#3399CC` for legibility on `#262624`
- Fonts: serif display for headings (Tiempos-alike → use `Source Serif 4`), `Inter` body, `JetBrains Mono` code
- Border radius 12px cards, 8px buttons; subtle 1px borders `rgba(0,0,0,0.08)` / `rgba(255,255,255,0.08)`
- Theme toggle persisted to localStorage, `class="dark"` strategy

**Env vars:** `MONGODB_URI`, `ANTHROPIC_API_KEY`

**Branch rules:** never push to main; one branch per session.

---

## CC-01 — App Scaffold + Shell + Data Models

**Branch:** `feature/scaffold-shell`
**Session type:** Scaffold
**POMs:** 3
**Depends on:** none

(Full prompt: see ~/context-2026/_planning/abc.md or the conversation that
spawned this repo.)

Outputs:
- /app/layout.tsx, /app/page.tsx (redirect to /chat), /app/globals.css
- /components/shell/Sidebar.tsx, ThemeProvider.tsx, ThemeToggle.tsx
- /lib/db.ts, /lib/constants.ts (design tokens, models list)
- /models/Chat.ts, Message.ts, Project.ts, ProjectFile.ts, Artifact.ts, Skill.ts, Connector.ts
- /app/settings/page.tsx

---

## CC-02 — Chats CRUD + Recents + History

**Branch:** `feature/chats-crud`
**Session type:** Scaffold + Integration
**POMs:** 3
**Depends on:** feature/scaffold-shell

Outputs:
- /app/api/chats/route.ts, /app/api/chats/[id]/route.ts
- /app/chat/[id]/page.tsx
- /components/chat/MessageList.tsx, MessageBubble.tsx, Composer.tsx, ChatHeader.tsx
- /components/chat/Markdown.tsx (shared renderer)
- /app/recents/page.tsx
- /lib/swr.ts (fetcher)

---

## CC-03 — Streaming Chat + Write & Code Modes

**Branch:** `feature/chat-streaming`
**Session type:** Integration
**POMs:** 3
**Depends on:** feature/chats-crud

Outputs:
- /app/api/chat/stream/route.ts
- /app/api/chats/[id]/title/route.ts
- /lib/systemPrompt.ts, /lib/anthropic.ts
- Modified: /components/chat/Composer.tsx, MessageList.tsx, /app/chat/[id]/page.tsx

---

## CC-04 — Artifacts + Split-Screen Preview

**Branch:** `feature/artifacts`
**Session type:** Integration
**POMs:** 4
**Depends on:** feature/chat-streaming

Artifact contract (in system prompt from CC-03):
```
<artifact identifier="kebab-id" type="code|markdown|html|react|svg|mermaid" title="..." language="...">...</artifact>
```

Outputs:
- /lib/artifacts/parse.ts, /lib/artifacts/reactHarness.ts (iframe srcdoc builder)
- /components/artifacts/ArtifactPanel.tsx, ArtifactCard.tsx, VersionPicker.tsx
- /app/api/artifacts/route.ts, /app/api/artifacts/[id]/versions/route.ts
- /app/artifacts/page.tsx, /app/artifacts/[id]/page.tsx
- Modified: /app/chat/[id]/page.tsx, /app/api/chat/stream/route.ts, MessageBubble.tsx

---

## CC-05 — Projects: CRUD, Instructions, Files, Memory

**Branch:** `feature/projects`
**Session type:** Scaffold + Integration
**POMs:** 4
**Depends on:** feature/artifacts

Outputs:
- /app/api/projects/route.ts, /app/api/projects/[id]/route.ts, /app/api/projects/[id]/files/route.ts, /app/api/projects/[id]/files/[fileId]/route.ts, /app/api/projects/[id]/memory/refresh/route.ts
- /app/projects/page.tsx, /app/projects/[id]/page.tsx
- /components/projects/ProjectCard.tsx, FileDropzone.tsx, InstructionsEditor.tsx, MemoryCard.tsx
- Modified: /lib/systemPrompt.ts, /app/api/chat/stream/route.ts, Sidebar.tsx

---

## CC-06 — Skills (claude.ai/customize/skills)

**Branch:** `feature/skills`
**Session type:** Scaffold + Integration
**POMs:** 3
**Depends on:** feature/projects

Outputs:
- /scripts/seedSkills.ts
- /app/customize/skills/page.tsx
- /components/skills/SkillCard.tsx, SkillEditorModal.tsx, SkillDrawer.tsx
- /app/api/skills/route.ts, /app/api/skills/[id]/route.ts
- /lib/skills.ts
- Modified: /lib/systemPrompt.ts, /app/api/chat/stream/route.ts, Sidebar.tsx (Customize section: Skills, Connectors)

---

## CC-07 — Connectors (gmail, slack, gdrive, gsheets)

**Branch:** `feature/connectors`
**Session type:** Integration
**POMs:** 4
**Depends on:** feature/skills

New env: `GOOGLE_CLIENT_ID`/`SECRET`, `SLACK_CLIENT_ID`/`SECRET`, `CONNECTOR_SECRET`, `NEXT_PUBLIC_APP_URL`.

Outputs:
- /app/customize/connectors/page.tsx
- /components/connectors/ConnectorCard.tsx, ToolCallChip.tsx
- /app/api/connectors/google/auth/route.ts, callback/route.ts, /app/api/connectors/slack/auth/route.ts, callback/route.ts, /app/api/connectors/[key]/route.ts, /app/api/connectors/[key]/ping/route.ts
- /lib/connectors/google.ts, slack.ts, tools.ts, crypto.ts
- Modified: /app/api/chat/stream/route.ts, MessageBubble.tsx

---

## CC-08 — Polish Pass

**Branch:** `feature/polish-v1`
**Session type:** Polish
**POMs:** 2
**Depends on:** feature/connectors

Outputs:
- /components/ui/Skeleton.tsx, EmptyState.tsx, CommandPalette.tsx
- Modified: every page above, /app/layout.tsx

---

## Build order & merge plan

| # | Branch | Unlocks |
|---|---|---|
| CC-01 | scaffold-shell | everything |
| CC-02 | chats-crud | CC-03 |
| CC-03 | chat-streaming | CC-04 |
| CC-04 | artifacts | split-screen UX |
| CC-05 | projects | memory + instructions |
| CC-06 | skills | /customize/skills |
| CC-07 | connectors | gmail/slack/gdrive/gsheets |
| CC-08 | polish-v1 | ship |

## Deliberate v1 exclusions

Auth/multi-user, voice, web search tool, image upload to chat, Research mode, billing. Each is a clean future CC session — the `userId` field and `systemPrompt` assembly function are the only seams they need.
