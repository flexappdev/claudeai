# Skills OS

## Purpose

Skills OS is the single local index for Mat's agent playbooks across Claude.ai, Claude Code, and Codex. It turns scattered `SKILL.md` definitions into one searchable command deck without moving or rewriting the source skills.

## Current snapshot

Verified on 6 August 2026:

| Metric | Count |
|---|---:|
| Physical definitions | 483 |
| Canonical skills | 332 |
| Claude Code | 199 |
| Codex | 174 |
| claudeai library/catalogue | 16 |
| Cross-platform | 56 |

Totals are live and may change as skills are added or removed.

## Behaviour

- Scans configured global and project skill roots on the server.
- Excludes private context roots and never returns filesystem paths or skill bodies to the browser.
- Parses only skill metadata for the index and merges exact slug matches.
- Caches filesystem results for 30 seconds.
- Uses bounded directory traversal so large repositories do not produce partial, non-deterministic results.
- Publishes a sanitized metadata-only snapshot to MongoDB for cloud runtimes that cannot access local skill folders. Filesystem paths and playbook bodies are never included.
- “Switch on here” imports a selected playbook into the local claudeai library, enables it, creates a chat, and prepares its slash invocation.
- Claude Code and Codex actions copy their native `/skill` or `$skill` invocation.

## Configuration

The scanner uses the current WSL home plus the configured Windows Codex root. Override the latter with `CODEX_SKILLS_ROOT` when the Codex home moves.

The inventory is deliberately local-first. A deployed Vercel instance will only see skills present in its server filesystem plus the MongoDB-backed claudeai library.

Official Claude.ai account skills are private hosted state and are not exposed to this local scanner. Manage those in Claude.ai under **Customize → Skills**; Skills OS can still index the source playbook and prepare it for the local claudeai app.
