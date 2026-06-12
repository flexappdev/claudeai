# /goal — claudeai v1

Reproduce claude.ai end-to-end as a Next.js 16 fleet site at `~/APPS/claudeai/`
(port `17001`, repo `flexappdev/claudeai`, accent Siemens blue `#006699`).

Single-user v1, no auth. `userId` field present on every model so multi-user
can be added later without a migration.

## Acceptance — 8 CC sessions

- [x] **Pre-flight** — registry row, REPOS.md, GitHub repo, BUILD-PLAN.md, GOAL.md
- [ ] **CC-01 scaffold-shell** — Next 16 boots on `17001`, sidebar collapses, theme toggles, 7 Mongoose models compile
- [ ] **CC-02 chats-crud** — create / rename / star / delete chats; sidebar recents; `/recents` searchable history
- [ ] **CC-03 chat-streaming** — composer streams from Anthropic; auto-title via haiku; Normal / Write / Code modes
- [ ] **CC-04 artifacts** — `<artifact>` parsed, split-screen 45/55, sandboxed iframe renders html + react + svg + mermaid + markdown + code; versions accumulate; `/artifacts` gallery
- [ ] **CC-05 projects** — CRUD + file upload (.md/.txt/.csv/.json/.pdf, 200KB×10 cap) + instructions + memory refresh; project context injected into system prompt
- [ ] **CC-06 skills** — `/customize/skills` page; 4 builtin seeds; enable toggle; SKILL.md upload; matcher injects up to 2 full bodies per message
- [ ] **CC-07 connectors** — `/customize/connectors`; OAuth flows for Gmail / Drive / Sheets / Slack; 8 tools registered when connected; graceful "Not configured" when OAuth creds absent
- [ ] **CC-08 polish-v1** — skeletons, empty states, Cmd+K palette, sonner toasts, mobile QA, no mongoose in client bundle

## Shipping checklist

- [ ] `npm run build` clean
- [ ] `npm run typecheck` clean
- [ ] Playwright smoke green (headless per [[feedback_wsl_headed_chromium]])
- [ ] `~/APPS/claudeai/README.md` written with hero diagram + dev/build/deploy commands
- [ ] `/abc-diagrams` — arch + ERD + artifact sequence diagrams
- [ ] `/abc-github` — secrets sync to flexappdev/claudeai Actions
- [ ] `/abc-vercel` — link to matsiems scope + env push + `vercel --prod`
- [ ] `/abc-ga` — activate GA4 if measurement ID exists in central env
- [ ] Registry `live_url` updated to prod Vercel URL
- [ ] `/push` final commit
- [ ] Memory entries: `project_claudeai_v1_shipped`, `reference_claudeai_repo`

## Env vars

| var | source | required for |
|---|---|---|
| `MONGODB_URI` | `~/context-2026/agents/.env` | CC-01 onwards (all routes that touch DB) |
| `ANTHROPIC_API_KEY` | `~/context-2026/agents/.env` | CC-03 onwards |
| `CONNECTOR_SECRET` | generated 32-byte hex | CC-07 (encrypts OAuth tokens) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | central env if present, else deferred | CC-07 (Gmail / Drive / Sheets) |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | central env if present, else deferred | CC-07 (Slack) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:17001` dev / prod Vercel URL | CC-07 (OAuth redirects) |
| `NEXT_PUBLIC_GA_ID` | central env if exists | CC-08 (analytics) |

## Out of scope (deferred)

Auth / multi-user, voice, web search tool, image upload to chat, Research mode,
billing. Each is a clean future CC session.
