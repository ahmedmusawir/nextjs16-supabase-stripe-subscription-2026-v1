# Workflow 03 — Write And Confirm

> Append the generated entry to the ledger (operator pastes per Section 4.1) and confirm completion. Also handles Path C (status updates on existing findings).

---

## Branch B Path — Append New Entry

### Step 1 — Present The Entry

Use the file-path-not-dump rule: tell the operator the destination file, show the entry to append.

For a **finding**:

> "Generated Finding #[N]. Append this to `agent_docs/security/SECURITY_FINDINGS.md` at the end of the file (after the last existing entry):
>
> ```markdown
> [generated entry from workflow/02a-capture-finding.md Step 8]
> ```
>
> Save the file. Confirm when done."

For a **backlog item**:

> "Generated cleanup item. Append this to `agent_docs/security/CLEANUP_BACKLOG.md` under the `## Open Items` section:
>
> ```markdown
> [generated entry from workflow/02b-capture-backlog.md Step 7]
> ```
>
> Save the file. Confirm when done."

### Step 2 — Verify Append

After operator confirms save:

```bash
# For findings:
grep "## Finding #[N]" agent_docs/security/SECURITY_FINDINGS.md
tail -25 agent_docs/security/SECURITY_FINDINGS.md

# For backlog:
grep -A 5 "### [title]" agent_docs/security/CLEANUP_BACKLOG.md
tail -15 agent_docs/security/CLEANUP_BACKLOG.md
```

EVIDENCE check: entry appears at end of file, formatted correctly.

### Step 3 — HIGH/CRITICAL Reminder

If the finding is severity HIGH or CRITICAL:

> "Reminder: This is [HIGH/CRITICAL]. Per project CLAUDE.md reading reflexes (if configured), this entry will:
> - Surface at session start for any work touching `[file path]`
> - Block phase close on phases that touch the affected surface
> - Block pre-deploy if not resolved or explicitly deferred
>
> Want me to also note this in today's session log at `agent_docs/sessions/session_YYYY-MM-DD.md`? It's optional but helpful for the audit trail."

If operator says yes, generate the session log snippet:

```markdown
### Finding Recorded — YYYY-MM-DD HH:MM

Finding #[N] (severity: [LEVEL]) recorded in agent_docs/security/SECURITY_FINDINGS.md.
Affected: [file path]
Status: [STATUS]
```

### Step 4 — Return Operator To Previous Task

> "Done. Finding #[N] (or cleanup item '[title]') recorded in `agent_docs/security/[FILE]`.
>
> Returning you to [audit at Phase X / your previous task / standby]."

---

## Branch C Path — Status Update On Existing Finding

### Step 1 — Locate The Finding

```bash
grep -A 5 "## Finding #[N]" agent_docs/security/SECURITY_FINDINGS.md | head -10
```

EVIDENCE check: confirm the finding exists, show current status to operator:

> "Found Finding #[N]:
> - Current status: [CURRENT]
> - Severity: [LEVEL]
> - Subject: [title]
>
> What's the new status?"

### Step 2 — Get The Update Details

Based on the target status, ask for context:

#### If FIXED

> "Updating to FIXED. Need:
> - Date of fix (default: today)
> - Brief resolution description (1–2 sentences)
> - Commit hash or PR number if applicable
> - Any tests added to lock the fix in?"

#### If IN PROGRESS

> "Updating to IN PROGRESS. Need:
> - Date started (default: today)
> - Who's working on it (you, a teammate, an automated process)
> - ETA if known"

#### If DEFERRED

> "Updating to DEFERRED. Need:
> - Reason for deferring (1 sentence)
> - Review date (when should we revisit?)
> - What would un-defer it?"

#### If WON'T FIX

> "Updating to WON'T FIX. This needs:
> - Rationale (clear, defensible)
> - Who signed off (operator, or named approver)
> - Confirmation that this isn't a HIGH/CRITICAL — those shouldn't be WON'T FIX without significant rationale"

### Step 3 — Generate The Surgical Edit

Generate the replacement block (the operator pastes over the existing entry's status line and adds the new section):

```markdown
**Status:** [NEW_ICON] [NEW_STATUS] [DATE]

### Resolution / Decision Record

[Content from Step 2]
```

Present it:

> "Update for Finding #[N]:
>
> Replace this line:
> ```
> **Status:** [OLD_LINE]
> ```
>
> With:
> ```
> **Status:** [NEW_LINE]
> ```
>
> And append this new section before the `---` separator:
> ```markdown
> ### [Resolution / Decision Record]
>
> [content]
> ```
>
> Save the file. Confirm when done."

### Step 4 — Verify Update

```bash
grep -A 3 "## Finding #[N]" agent_docs/security/SECURITY_FINDINGS.md | head -5
```

EVIDENCE check: status line shows new state.

### Step 5 — CHANGELOG Entry If FIXED

If the status moved to FIXED, also recommend a CHANGELOG entry:

> "Since Finding #[N] is now FIXED, recommend adding to CHANGELOG.md under `[Unreleased]` → `Security`:
>
> ```markdown
> - Fixed security finding #[N]: [brief description] ([commit/PR if applicable])
> ```
>
> Paste and save."

### Step 6 — Return Operator To Previous Task

> "Finding #[N] status updated to [NEW]. Returning you to [previous task / standby]."

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Operator forgets to save file | Distracted mid-task | Send a gentle reminder; verify via grep before declaring done |
| Wrong finding number used in append | Counted incorrectly | Re-check sequential numbering — see workflow/02a Step 8 |
| Status update on a finding that doesn't exist | Typo or wrong number | EVIDENCE-check before proposing the edit; surface to operator |
| Append landed in wrong file | Confused FINDING vs BACKLOG | Surface, move entry to correct file, verify |

---

## Checkpoint

Skill invocation complete when:

### Branch B (New Capture)
- [ ] Entry generated correctly
- [ ] Operator confirmed save
- [ ] EVIDENCE check confirms entry in file
- [ ] If HIGH/CRITICAL: session log reminder offered
- [ ] Operator returned to previous task

### Branch C (Status Update)
- [ ] Finding located in file
- [ ] Update details captured
- [ ] Surgical edit generated and presented
- [ ] Operator confirmed save
- [ ] EVIDENCE check confirms status updated
- [ ] CHANGELOG entry generated if status moved to FIXED
- [ ] Operator returned to previous task

---

## Skill Done. Returning To Standby.

🛡️
