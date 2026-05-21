# Workflow 02b — Capture Backlog Item (Branch B)

> Capture questions for a CLEANUP ITEM. Lighter than the finding capture — backlog items are tracked, not prosecuted. 4–5 questions.

---

## Step 1 — Title

> "Short title for the item? (e.g., 'Dead priceAfterDiscount calc in orderTransform.ts')
>
> Keep it descriptive but brief — this becomes the header in the backlog file."

---

## Step 2 — Location

> "Where in the code?
> - File path
> - Line refs if known
> - Or 'repo-wide' if it's a pattern that crosses many files"

---

## Step 3 — Description

> "Brief description — 1 to 3 sentences. What's there and why is it being tracked?
>
> Even shorter than a finding. This is hygiene work, not a security incident."

---

## Step 4 — Fix Path

> "What's the fix approach? One sentence is fine. (e.g., 'remove the computation; remove the console.log')"

If the fix is non-obvious, allow 2–3 sentences.

---

## Step 5 — Risk If Left

> "Risk if we leave it?
> - **VERY LOW** — purely cosmetic, no functional/security impact
> - **LOW** — minor, won't break anything
> - **MEDIUM** — could cause confusion or future bugs
> - **HIGH** — should be addressed soon (still not security-critical, or it would be a Finding)
>
> My read: [SUGGESTED LEVEL]. Confirm or adjust?"

Propose a level based on the description; let the operator confirm.

---

## Step 6 — Notes (Optional)

> "Any context, blockers, or dependencies on other work? Skip if none."

Common notes:
- "Best done as a focused sprint, not piecemeal"
- "Wait until X migration is complete first"
- "Related to Finding #N — fix together"

---

## Step 7 — Generate The Entry

Using the format from `references/BACKLOG_TEMPLATE.md`, generate:

```markdown
### [Title from Step 1]

- **Location:** [file/path or 'repo-wide']
- **Description:** [from Step 3]
- **Fix path:** [from Step 4]
- **Risk if left:** [LEVEL] — [short reasoning]
- **Notes:** [from Step 6, or omit if none]

---
```

Unlike findings, backlog items aren't numbered — they're tracked by title and location.

---

## Step 8 — Proceed To Write-And-Confirm

> "Entry drafted. Moving to `workflow/03-write-and-confirm.md` to append it to the backlog and confirm with you."

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Description has security implication | Should have been a FINDING | Surface the mismatch, offer to switch to Branch A |
| Multiple unrelated items in one description | Operator grouping disparate hygiene work | Recommend separate entries — keeps the backlog scannable |
| Operator wants HIGH risk on cleanup item | The thing might actually be a FINDING | Discuss — HIGH-risk cleanup is borderline FINDING territory |

---

## Checkpoint

Capture complete when:

- [ ] Title captured (Step 1)
- [ ] Location identified (Step 2)
- [ ] Description captured (Step 3)
- [ ] Fix path sketched (Step 4)
- [ ] Risk level confirmed (Step 5)
- [ ] Notes captured or marked N/A (Step 6)
- [ ] Entry generated (Step 7)

Next file: `workflow/03-write-and-confirm.md`
