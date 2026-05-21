---
name: repo-security-audit
description: >
  Conduct a full security audit of a repo's npm dependency tree. Walks the operator through six phases:
  baseline capture, safe wins, triage, execution, bookkeeping, and re-baseline. Targets clean repo
  (0 vulnerabilities) with a complete audit record. Use when the operator says "audit this repo,"
  "do a security pass," "run an npm audit cycle," "clean up the deps," "check for vulnerabilities,"
  or as a Pre-Phase 1 setup task before fabrication begins on a new build. Does NOT execute npm
  commands without operator approval (read-only until APPROVED per family doctrine Section 4.1).
  Does NOT include the three-repo promotion procedure (preserved in PLAYBOOK reference only,
  Dockbloxx-specific topology, not a recurring workflow for Supabase + Vercel projects).
allowed-tools: [Read, Bash, Grep]
---

# repo-security-audit — Methodology

## When To Use This Child Skill

Engage when the operator's First Question Fork answer is **"audit"** (Path A of the family activation matrix). Concrete triggers:

- "Audit this repo"
- "Run a security pass"
- "Do an npm audit cycle"
- "Clean up the deps"
- "Get this repo to zero vulns"
- Pre-Phase 1 of a new build (factory pattern)
- Quarterly hygiene check on a stable repo

Do NOT engage for: tangential findings discovered during other work (use `repo-security-findings-tracker` instead), or pre-install threat checks (Path D placeholder).

## Workflow Files To Walk

Walk in this exact order. One phase at a time. Wait for operator confirmation between phases.

1. `workflow/00-pre-flight.md` — threat-landscape check, safety branch, repo confirmation
2. `workflow/01-baseline.md` — capture starting vulnerability profile (Phase 0)
3. `workflow/02-safe-wins.md` — apply `npm audit fix` for free wins (Phase 1)
4. `workflow/03-triage.md` — decide remove/upgrade/override/accept per remaining vuln (Phase 2)
5. `workflow/04-execute.md` — apply decisions one at a time (Phase 3)
6. `workflow/05-bookkeep.md` — CHANGELOG, session log, RECOVERY.md (Phase 4)
7. `workflow/06-re-baseline.md` — confirm clean audit, build, tests (Phase 5)

## References To Pull When Needed

- `references/PLAYBOOK.md` — the v0.6 SOP. Read for the WHY behind any principle (P1–P12). Always available.
- `references/DECISION_TEMPLATES.md` — triage table format, bookkeeping entry templates. Pull during Phase 2 and Phase 4.
- `references/ANTI_PATTERNS.md` — known failure modes (`EOVERRIDE`, `.next` cache, stray lockfiles, `--force` traps). Pull when something behaves unexpectedly.

## Decision Trees To Walk When Operator Hesitates

- `decision-trees/remove-vs-upgrade.md` — when triage on a dep is ambiguous
- `decision-trees/direct-vs-transitive.md` — when vuln location is unclear or parent upgrade is questioned
- `decision-trees/override-vs-migrate.md` — when override is on the table vs a breaking upgrade

## Critical Behaviors

### File-Path-Not-Dump Rule

When a reference file contains content for the operator to paste elsewhere (e.g., CHANGELOG entries, session log structure), **point the operator to the file path — do not paste long content into chat**. The operator opens the file in their editor, copies, pastes into the destination. CLI text is hard to copy accurately.

This applies most to Phase 4 (Bookkeeping) where multiple structured entries are generated.

### Audio-First Output

The operator listens to responses via screen reader. When output gets long (especially when reading back `npm audit` results or triage proposals), break into PARTS. Output Part 1, wait for "2", output Part 2. Never dump 3000+ words at once.

### Pause On Tangential Findings

If during ANY phase a non-audit issue surfaces — leaked error message, missing input validation, dead code with security implication — do NOT fix inline. That breaks audit focus.

Instead, surface to the operator:

> "Noticed [FINDING] while running the usage check for [DEP]. This is outside the audit scope. I recommend pausing here, invoking `repo-security-findings-tracker` to capture it cleanly, then returning to the audit. Approve?"

If approved, the operator pauses the audit, switches to the tracker skill, logs the finding, returns to the audit at the exact paused step.

### Verification Discipline (Family Section 4.5/4.6)

Every phase has a verification gate. "Success. No errors." is not verification. Verification is a truth command that confirms repo state. Label every claim EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION.

## Examples

### Example 1: Operator Activates The Audit

```
Operator: "Audit this repo."

Response: "Activating Path A — full security audit. Reading workflow/00-pre-flight.md...

Before any install commands, I need to run a 60-second threat-landscape check per P11 (family
doctrine Section 6.4). I'll web-search for active npm supply-chain attacks in the past 7 days
and check for overlap with this project's deps. This is read-only — no changes to the repo.

Approve to proceed?"
```

### Example 2: Triage Proposal On A Vuln

```
Operator: "Continue triage."

Response: "Phase 2 triage on `axios`. Findings from usage check:

- EVIDENCE: 0 imports across src/ (grep with require + from patterns, excluded node_modules and .next/)
- EVIDENCE: 2 references in docs/ (markdown examples, no code calls)
- EVIDENCE: `@types/axios` declared in devDependencies — likely orphaned

Proposed decision: REMOVE (per P2 hierarchy — unused dep is the safest fix)

Reasoning: zero source imports, docs references are aspirational examples not live code. Removing
eliminates the dep AND the type package.

Approve REMOVE on axios? Or want to discuss UPGRADE / ACCEPT alternatives?"
```

### Example 3: --force Request Triggers Doctrine

```
Operator: "Just npm audit fix --force, let's move."

Response: "Acknowledged — that overrides family doctrine Section 4.2 (No --force Without Explicit
Approval). The failure mode that gate prevents: --force can downgrade frameworks (we've seen
Next 15 → 9.3.3 in one shot) or cascade breaking changes across multiple deps. The dry-run is
the only way to see what's coming before it lands.

Running the dry-run first — this is read-only:

  npm audit fix --force --dry-run 2>&1 | grep -E '(install|major|breaking)'

I'll read the output back and we decide together whether the --force run is safe. ETA: 30 seconds.

Proceed with the dry-run?"
```

## What This Skill Does NOT Do

- Execute npm commands without operator APPROVED (family doctrine Section 4.1)
- Run `npm audit fix --force` without dry-run review (family doctrine Section 4.2)
- Walk the three-repo promotion procedure (preserved in PLAYBOOK reference; not a recurring workflow)
- Fix tangential findings inline (hands off to `repo-security-findings-tracker`)
- Modify files inside `stark-repo-security/` (family doctrine Section 4.9)
- Auto-invent dep names, version numbers, or severity assessments (family doctrine Section 4.7)
- Walk a partial audit (no skipping phases — each gates the next)

## Done Criteria

Phase 5 verification passes when ALL true:

1. `npm audit` reports 0 vulnerabilities
2. `npm run build` succeeds
3. `npm test` passes (or operator confirms tests out of scope)
4. CHANGELOG, session log, RECOVERY.md updated per P4
5. Safety branch ready for merge
6. Any tangential findings logged via `repo-security-findings-tracker`
7. Operator confirms close-out

Until all seven are confirmed, the audit is NOT complete. Partial success is partial failure.

## Tony Stark Protocol (Skill-Specific Discipline)

> One phase at a time. Verify with a command, not with hope. Pause for findings, never fix silently.
> Speed comes from rigor.

The 0-vulnerability target is achievable BECAUSE we don't skip phases, not despite it.
