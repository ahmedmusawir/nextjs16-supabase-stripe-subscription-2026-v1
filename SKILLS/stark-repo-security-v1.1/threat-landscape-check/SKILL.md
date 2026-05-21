---
name: threat-landscape-check
description: >
  Research-only threat-landscape assessment for an npm-based repo. Reads `package.json`, extracts
  direct dependencies, runs web research per dep against four vectors (recent advisories,
  supply-chain attacks, maintainer changes, typosquat similarity), reports PROCEED / CAUTION /
  HALT verdict per dep with a repo rollup. Use when the operator says "check the threat landscape,"
  "research these deps," "is it safe to audit," "run a P11 check," "are any of our deps under
  attack," or any equivalent indicating they want intelligence before action. Recommended as the
  first step before any `repo-security-audit` run. Does NOT install, modify, or commit anything —
  pure research, pure reporting (per family doctrine Section 4.1, read-only).
allowed-tools: [Read, Bash, WebSearch]
---

# threat-landscape-check — Methodology

## When To Use This Child Skill

Engage when the operator's First Question Fork answer is **"threat-landscape check"** (Path A of the family activation matrix). Concrete triggers:

- "Run a threat-landscape check before we audit"
- "Are any of our deps under attack right now?"
- "Check what's installed in this repo for active threats"
- "Run a P11 check"
- "Is it safe to proceed with the audit?"
- Periodic hygiene check (monthly / quarterly)
- Reaction to a public supply-chain incident in the news

Do NOT engage for: full security audits (use `repo-security-audit`, Path B), recording specific findings (use `repo-security-findings-tracker`, Path C/D), or anything involving installation/modification of deps.

## Critical Identity Statement

**This skill is pure research.** It performs zero state changes. It does NOT:

- Run `npm install`, `npm uninstall`, `npm update`, `npm audit fix`
- Modify `package.json` or `package-lock.json`
- Create, edit, or delete files in the repo (except optionally: a single report file in `agent_docs/security/threat-checks/` if the operator opts in at intake)
- Run `git` commands beyond read-only inspection
- Make commits
- Apply fixes

It DOES:

- Read `package.json` (read-only)
- Run web searches for threat-landscape data
- Run `npm view <package>` commands (read-only registry queries)
- Generate a report and present it to the operator
- Offer to invoke `repo-security-findings-tracker` (Path C) if HALT verdicts surface

When the report finishes, the skill returns the operator to their previous task or to standby. **Installation, fixes, and changes are entirely outside this skill's mandate.**

## Workflow Files To Walk

Walk in this exact order. One phase at a time.

1. `workflow/00-intake.md` — confirm read-only mode, pick output level (Tight / Standard / Thorough), confirm scope
2. `workflow/01-target-discovery.md` — parse `package.json`, extract direct deps, present the target list to the operator
3. `workflow/02-threat-research.md` — for each dep, run the four research vectors (advisories, supply-chain attacks, maintainer changes, typosquat check)
4. `workflow/03-report.md` — verdict per dep (PROCEED / CAUTION / HALT) + repo rollup, at the chosen output level

## References To Pull When Needed

- `references/RED_FLAGS.md` — what signals to look for and how to weight them. Pull during Phase 2 when assessing research results.
- `references/SEARCH_PATTERNS.md` — query templates with current-date placeholders. Pull during Phase 2 before running web searches.

## Decision Trees To Walk When Operator Hesitates

- `decision-trees/proceed-caution-halt.md` — how to translate research findings into a verdict, especially when signals are mixed

## Critical Behaviors

### Output Level Is Operator's Call

At intake (Phase 0), present three output levels and let the operator pick. Do NOT pick for them. Match the chosen level for the entire run.

| Level | Per Dep | Rollup |
|---|---|---|
| **Tight** | 1 line (icon + dep + verdict + 1-sentence reason) | 1 summary line + HALT details |
| **Standard** | 3-5 lines (verdict + main concern + recommendation) | Brief rollup with HALT details and a CAUTION roll-up |
| **Thorough** | Full card per dep (verdict, advisories, maintainer status, downloads, sources) | Full report with alternatives discussion and monitoring suggestions |

### Web Searches Use Current Date

Search queries that reference "recent" activity must include the current month and year explicitly. The current date is available in chat context. Example: `axios npm supply chain attack May 2026`, not `axios npm supply chain attack recent` (search engines deprioritize "recent" as a query token).

See `references/SEARCH_PATTERNS.md` for canonical query templates.

### Verdict Weighting

The verdict logic lives in `decision-trees/proceed-caution-halt.md`. Quick reference:

- **HALT** = active attack on the package OR critical advisory in past 30 days OR confirmed maintainer compromise
- **CAUTION** = recent advisory (past 90 days) at moderate+ severity OR maintainer change in past 6 months OR typosquat collision OR low download count + recent publish
- **PROCEED** = no concerning signals

When in doubt between two verdicts, escalate to the more conservative one. False positives cost 30 seconds of operator review; false negatives cost an incident.

### Pause On Active Threats

If any dep gets a HALT verdict due to an **active supply-chain attack** (someone published malware to npm in the past 7 days under this name or a near-typo), explicitly call it out at the top of the report:

> "🚨 **ACTIVE ATTACK ALERT** 🚨
> 
> Dep `<name>` matches an active supply-chain attack reported [date]. Source: [URL].
> 
> Recommendation: HALT all audit/install activity on this repo until verified safe. Offer to log this as a CRITICAL finding via `repo-security-findings-tracker` (Path C) so the active-threat awareness is recorded in the project's ledger."

### File-Path-Not-Dump Rule

If the operator opts in to saving the report to `agent_docs/security/threat-checks/YYYY-MM-DD-threat-check.md`, generate the content for the operator to paste (per family doctrine Section 4.1 — even writing a report is a state change). Don't paste the whole report twice into chat — present it once at the chosen level, then offer the file-save option.

### Audio-First Output

The operator listens to responses via screen reader. Even at "Thorough" level, break long output into PARTS. Output Part 1, wait for "2", output Part 2. Especially relevant for repos with 20+ direct deps — that's a long report.

## Examples

### Example 1: Tight Output Level

```
Operator: "Run threat-landscape check, tight output."

Response (after intake + discovery + research):
"📊 Threat-landscape check — Cyber Pharma v1 — 2026-05-19

Direct deps scanned: 14

✅ next@15.4.1 — PROCEED
✅ @supabase/supabase-js@2.45.3 — PROCEED
✅ @supabase/ssr@0.5.1 — PROCEED
✅ zod@3.22.4 — PROCEED
⚠️ axios@1.6.2 — CAUTION (1 moderate advisory past 90d)
✅ tailwindcss@3.4.1 — PROCEED
✅ react@18.3.1 — PROCEED
... [9 more] ...

Rollup: 13 PROCEED / 1 CAUTION / 0 HALT
Audit-readiness: PROCEED (CAUTION items don't block; document during audit)
Source: https://github.com/advisories/GHSA-xxxx (axios advisory)"
```

### Example 2: HALT Triggered By Recent Attack

```
Operator: "Standard output."

Response:
"🚨 ACTIVE ATTACK ALERT 🚨

Dep @tanstack/react-query@5.x matches an active supply-chain attack reported 2026-05-12 affecting versions 5.65.0–5.65.2. Source: https://github.com/TanStack/query/issues/xxxx.

Cyber Pharma v1 currently installs: @tanstack/react-query@5.62.0. Status: NOT in the affected version range, but adjacent — recommend HALT until verified.

Recommendation: 
1. Pin @tanstack/react-query in package.json to ≤ 5.64.x explicitly until incident resolved
2. Log this as a CRITICAL finding via repo-security-findings-tracker so the awareness persists
3. Re-run threat-landscape-check in 1 week to verify resolution

Want me to invoke repo-security-findings-tracker (Path C) to log this now?"
```

### Example 3: Recommending Threat-Check Before Audit (From Family CLAUDE.md §5.3)

This happens automatically when the operator picks Path B (Audit) but no recent threat-check exists. The family doctrine routes correctly — this skill doesn't initiate it, but it does respond:

```
Operator: "yes, run threat-check first then we'll audit"

Response: "Activating Path A (threat-landscape-check) ahead of Path B (audit). Reading workflow/00-intake.md..."
```

## What This Skill Does NOT Do

- Install, uninstall, update, or modify any dep (family doctrine Section 4.1, plus skill-specific identity above)
- Edit `package.json`, `package-lock.json`, or any source file
- Run `npm audit fix` (use `repo-security-audit`, Path B)
- Log findings automatically (offers to invoke `repo-security-findings-tracker`, but the operator initiates)
- Audit transitive deps individually (transitive vuln assessment is the audit's job; threat-check is direct-dep + supply-chain-news focused)
- Make architecture decisions (e.g., "you should switch from X to Y") — surfaces signals, operator decides

## Done Criteria

Skill invocation complete when ALL true:

1. `package.json` parsed and direct deps enumerated
2. Web research run per dep against the four vectors (or batched and confirmed comprehensive)
3. Verdict assigned to each dep with cited reasoning
4. Repo rollup verdict delivered at the chosen output level
5. If any HALT verdicts: offer to log them via `repo-security-findings-tracker` (Path C) — operator's call whether to invoke
6. If operator opted in to saving the report: file content generated for paste to `agent_docs/security/threat-checks/`
7. No state changes made (bundle untouched, repo untouched, only chat output and optional report file)
8. Operator confirms close-out

Until all true: surface the gap. Partial verification is not a verdict.

## Tony Stark Protocol (Skill-Specific Discipline)

> Research, don't act. Report, don't recommend. Surface signals, let the operator decide.
> The most valuable thing this skill produces is *information at the right moment.*

The point of this skill is to put intelligence into the operator's hands BEFORE any state change happens elsewhere. If it ever produces a state change of its own, it has failed its identity.

🛡️
