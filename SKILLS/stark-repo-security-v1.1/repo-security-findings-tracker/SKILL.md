---
name: repo-security-findings-tracker
description: >
  Capture security findings or cleanup items discovered outside the audit cycle, without derailing
  the current work. Two branches: capture a new finding/item, OR update status on an existing finding.
  Writes to the project's security ledger at agent_docs/security/. Use when the operator says
  "log a finding," "found something," "add to cleanup backlog," "track this," "update Finding #N
  status," or any variation indicating tangential discovery during other work. Does NOT execute
  fixes — capture only (per family doctrine Section 4.1, read-only until APPROVED).
allowed-tools: [Read, Bash]
---

# repo-security-findings-tracker — Methodology

## When To Use This Child Skill

Engage when the operator's First Question Fork answer is **"recording a new finding"** (Path B) or **"updating an existing finding's status"** (Path C). Concrete triggers:

- "Log a finding"
- "Found something — add it to the tracker"
- "Add to cleanup backlog"
- "Track this issue"
- "Update Finding #2 — it's FIXED now"
- "Mark Finding #5 as DEFERRED"
- Mid-audit discovery handoff from `repo-security-audit`
- During code review when something tangential surfaces

Do NOT engage for: full security audits (use `repo-security-audit` Path A) or pre-install threat checks (Path D placeholder).

## Workflow Files To Walk

### Path B — Capture New Finding/Item

1. `workflow/00-initialize-folder.md` — create `agent_docs/security/` if it doesn't exist
2. `workflow/01-categorize.md` — finding vs cleanup item decision
3. `workflow/02a-capture-finding.md` OR `workflow/02b-capture-backlog.md` — branch based on Step 2
4. `workflow/03-write-and-confirm.md` — append to ledger, confirm to operator

### Path C — Update Existing Finding Status

1. `workflow/00-initialize-folder.md` (verify, don't initialize)
2. Skip to `workflow/03-write-and-confirm.md` in status-update mode

## References To Pull When Needed

- `references/FINDINGS_TEMPLATE.md` — format for `SECURITY_FINDINGS.md` entries. Pull during Path B Step 2a or Path C status updates.
- `references/BACKLOG_TEMPLATE.md` — format for `CLEANUP_BACKLOG.md` entries. Pull during Path B Step 2b.

## Decision Trees To Walk When Operator Hesitates

- `decision-trees/finding-vs-cleanup.md` — when category is unclear

## Critical Behaviors

### Speed Over Ceremony

This skill should take 2–3 minutes per invocation. The operator is mid-task — capture cleanly, don't interrogate. Default to 5–7 short questions, not 20.

### Don't Derail The Current Task

If the operator was in the middle of an audit or other work, capture the finding and explicitly return them:

> "Finding #N recorded in `agent_docs/security/SECURITY_FINDINGS.md`. Returning you to [the audit at Phase X / your previous task]."

### Recommend Not Fix

Per family doctrine Section 4.1, capture is read-only. Even if a fix seems trivial, do NOT propose fixing inline. The ledger captures the finding; the fix happens in a focused session later.

Exception: if the operator's stated goal IS to fix it now and capture the record of what was fixed, the skill handles that — but the fix is a separate decision the operator makes consciously. Default behavior: capture only.

### Sequential Numbering, Never Renumber

Findings get numbered in order of discovery. If Finding #3 is later closed as WON'T FIX, #4 still stays #4. Stable numbering across time means external references (CHANGELOG, commits, comments) remain valid.

When adding a new finding, read the existing file to determine the highest existing number and use N+1.

### File-Path-Not-Dump Rule

When generating an entry to append to a ledger file, point the operator to the file path and provide the entry text. Do NOT paste enormous formatted entries into chat that the operator then has to re-copy.

For status updates: locate the existing entry, generate the surgical edit (or full replacement), present it for paste.

## Examples

### Example 1: Mid-Audit Capture

```
Operator: "Hey claudy — while you were grepping for axios, I noticed /api/users/route.ts
           returns error.message in the catch block. That's a PHI leak."

Response: "Pausing the audit. Engaging repo-security-findings-tracker, capture branch.

Quick questions:

1. Severity? My read: HIGH (PHI leak vector). Confirm or adjust?
2. Status? OPEN (you noticed it, not yet fixed) — correct?
3. File path: src/app/api/users/route.ts (confirmed)
4. Brief fix sketch? My suggestion: log full error server-side, return generic message to client.
   Confirm or refine?

Answer those four and I'll generate the entry."
```

### Example 2: Quick Cleanup Item

```
Operator: "Also throw in the backlog: there's a dead console.log in
           src/lib/orderTransform.ts that's been there since the refactor."

Response: "Logging to CLEANUP_BACKLOG.md. Risk level? Sounds like VERY LOW (inert dead code).
           Confirm?"

Operator: "Yeah, very low."

Response: "Generated. Appended to agent_docs/security/CLEANUP_BACKLOG.md. Returning you to
           the audit at Phase 2 triage on the next vuln."
```

### Example 3: Status Update

```
Operator: "Mark Finding #2 as FIXED. I added the zod schema, commit abc1234."

Response: "Engaging Path C — status update. Reading SECURITY_FINDINGS.md to locate Finding #2...

EVIDENCE: Finding #2 is currently OPEN, severity MEDIUM, recommends zod validation on
          /api/create-payment-intent.

Proposed update:
- Status: 🔴 OPEN → ✅ FIXED 2026-05-19
- Adding Resolution section referencing commit abc1234

Generate the edit? Confirm and I'll produce the surgical replacement for you to paste."
```

## What This Skill Does NOT Do

- Execute fixes for the findings it captures (capture only, per family doctrine Section 4.1)
- Propose what to do about findings — only recommend categorization and format
- Modify findings that aren't being explicitly updated (no batch edits, no cleanup of old entries)
- Renumber existing findings (stable numbering, ever)
- Operate without `agent_docs/security/` existing (initializes on first run with approval)
- Audit deps or check threat landscape (use `repo-security-audit` or Path D placeholder)

## Done Criteria

### Path B (Capture)

1. `agent_docs/security/SECURITY_FINDINGS.md` or `CLEANUP_BACKLOG.md` updated with the new entry
2. Finding numbered correctly (sequential)
3. If HIGH/CRITICAL: session log reminder offered
4. Operator returned to previous task

### Path C (Status Update)

1. Existing finding entry updated in place (status icon + date + resolution if applicable)
2. CHANGELOG entry generated if status moved to FIXED
3. Operator returned to previous task

## Tony Stark Protocol (Skill-Specific Discipline)

> Capture cleanly. Don't interrogate. Don't fix silently. Don't derail.
> The ledger is for what's known but not yet acted on.

Speed comes from focus — this skill exists so the audit and other deep work stay focused.
