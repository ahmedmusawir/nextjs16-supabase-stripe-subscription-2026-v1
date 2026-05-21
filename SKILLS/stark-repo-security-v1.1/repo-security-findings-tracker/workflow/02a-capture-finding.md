# Workflow 02a — Capture Finding (Branch A)

> Capture questions for a SECURITY FINDING. Keep it tight — 5–7 questions, then generate. Don't interrogate.

---

## Step 1 — Severity

> "Severity? Use this rubric:
> - 🔴 **CRITICAL** — Production data exposure, RCE, auth bypass, payment fraud vector
> - 🟠 **HIGH** — PII / financial data leak, missing input validation on money/PHI paths
> - 🟡 **MEDIUM** — Hardening opportunity, missing defense-in-depth, fraud-enabling without active leak
> - 🟢 **LOW** — Code smell with security implication, best-practice deviation
>
> Based on your description, my read is [SUGGESTED LEVEL]. Confirm or adjust?"

Propose a severity based on the description; let the operator confirm or override.

---

## Step 2 — Status

> "Status?
> - 🔴 **OPEN** — confirmed, no fix yet
> - 🟡 **IN PROGRESS** — fix planned or in flight
> - ✅ **FIXED** — addressed and verified (use if you fixed it inline already)
> - ⚪ **DEFERRED** — acknowledged, intentionally not addressed yet
>
> What's the current state?"

Most common answer: OPEN (operator found it, hasn't fixed yet).

If FIXED inline, capture the resolution details in Step 6.

---

## Step 3 — Location

> "Where in the codebase?
> - File path (e.g., `src/app/api/users/route.ts`)
> - Function name if applicable
> - Line numbers if you have them"

If operator says "the whole module" or similar, capture that — precision is good but not mandatory at capture time.

---

## Step 4 — Problem Description

> "Brief description — 2 to 4 sentences. What's wrong? What's the attack vector? What data or capability is exposed?
>
> Don't worry about prose polish — this is for the ledger record."

The description should answer:
- What's wrong (mechanically)
- What an attacker could do
- What's exposed if exploited

---

## Step 5 — Discovery Context

> "How did you find it? One sentence is fine. (e.g., 'while grepping for axios usage during the security audit' — gives future readers context for why it surfaced)"

Why this matters: six months from now, someone reading the ledger wants to know if the discovery context suggests similar issues elsewhere.

---

## Step 6 — Recommended Fix

> "What's the fix approach? Doesn't need to be code — just the strategy. (e.g., 'add zod schema validation at top of POST handler')"

If the finding is FIXED inline:

> "Since it's already FIXED, capture:
> - What you did (1–2 sentences)
> - Commit hash or PR number if applicable
> - Any tests added to lock the fix in"

---

## Step 7 — Mitigation Until Fix (Optional)

> "Any mitigations active until the fix lands? (e.g., rate limiting, WAF rule, monitoring) — skip if none."

Most findings: no current mitigation. Skip if so.

---

## Step 8 — Generate The Entry

Using the format from `references/FINDINGS_TEMPLATE.md`, generate the entry:

```markdown
## Finding #[NEXT_NUMBER] — [SHORT_TITLE]

**Status:** [ICON] [STATUS] [DATE if FIXED/IN PROGRESS]
**Severity:** [ICON] [SEVERITY] ([1-line rationale])

### Problem

[Problem description from Step 4]

### Discovery

[Discovery context from Step 5]

### Recommended Fix

[Fix sketch from Step 6]

### Mitigation Until Fix

[From Step 7, or omit section if none]

### Files

- `[file path from Step 3]` ([function/line range if known])

---
```

To determine `[NEXT_NUMBER]`:

```bash
grep -oE "^## Finding #[0-9]+" agent_docs/security/SECURITY_FINDINGS.md | grep -oE "[0-9]+" | sort -n | tail -1
```

The next finding is that number + 1. If grep returns nothing, this is Finding #1.

---

## Step 9 — Proceed To Write-And-Confirm

> "Entry drafted. Moving to `workflow/03-write-and-confirm.md` to append it to the ledger and confirm with you."

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Operator gives one-word answers | Mid-task, doesn't want to be interrogated | Reduce question count, ask for the minimum and infer the rest |
| Description doesn't match severity | Operator under/overestimating | Surface the mismatch, ask to reconcile |
| Two findings described in one capture | Operator clustered related issues | Recommend two separate Finding entries — they may diverge in status over time |
| Description is actually a question | Operator unsure if it's a real finding | Move to discussion mode briefly — capture only if confirmed real |

---

## Checkpoint

Capture complete when:

- [ ] Severity confirmed (Step 1)
- [ ] Status confirmed (Step 2)
- [ ] Location captured (Step 3)
- [ ] Problem described (Step 4)
- [ ] Discovery context captured (Step 5)
- [ ] Recommended fix sketched (Step 6)
- [ ] Mitigation captured or marked N/A (Step 7)
- [ ] Entry generated with correct sequential number (Step 8)

Next file: `workflow/03-write-and-confirm.md`
