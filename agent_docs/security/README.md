# Security Ledger — nextjs16-supabase-stripe-subscription-2026-v1

This folder is the project's security ledger. Three files plus optional threat-check reports:

- **`SECURITY_FINDINGS.md`** — Real security issues in this project's code (and, by operator decision on 2026-05-21, framework-level dep-vulnerability findings flagged for deploy-time visibility). PII leaks, missing input validation, error message leaks, auth gaps, fraud vectors. Tracked actively. **Blocks deploy if OPEN HIGH/CRITICAL entries exist** (per project root `CLAUDE.md` reflexes, if configured).

- **`CLEANUP_BACKLOG.md`** — Technical debt with security overtones — dead code, deprecated patterns, lint warnings. Tracked passively, no deploy block.

- **`threat-checks/`** — Dated threat-landscape reports from the `threat-landscape-check` child skill. Each report scans `package.json` direct deps against four research vectors (advisories, supply-chain attacks, maintainer changes, typosquat similarity).

- **`README.md`** — This file.

## How To Add Entries

Use the `SKILLS/stark-repo-security-v1.1/repo-security-findings-tracker/` skill. Invocation:

> "Claudy, go read the stark-repo-security folder and follow it. I want to record a new finding."

The skill walks the capture conversationally and writes the entry here.

## How To Run A Threat-Landscape Check

Use the `SKILLS/stark-repo-security-v1.1/threat-landscape-check/` child skill (Path A of the activation matrix). Invocation:

> "Claudy, go read the stark-repo-security folder and follow it. Run a threat-landscape check."

The skill is research-only — no installs, no edits — and writes a dated report to `threat-checks/`.

## How These Files Get Read

The project's root `CLAUDE.md` should include security ledger reading reflexes (at session start, phase close, pre-deploy, code review) so the ledger functions as a deployment gate, not just a notepad. See `SKILLS/stark-repo-security-v1.1/CLAUDE.md` Section 6.5 for the reflex template.

---

## Folder State

| File | Initialized | Notes |
|---|---|---|
| `SECURITY_FINDINGS.md` | 2026-05-21 | Seeded with Findings #1-3 (Next.js + React + React-DOM CVEs disclosed May 6, 2026) |
| `CLEANUP_BACKLOG.md` | 2026-05-21 | Empty (no open items yet) |
| `threat-checks/2026-05-21-threat-check.md` | 2026-05-21 | First threat-landscape check report |

🛡️ *Folder initialized by `stark-repo-security-v1.1 / repo-security-findings-tracker / workflow/00-initialize-folder.md`.*
