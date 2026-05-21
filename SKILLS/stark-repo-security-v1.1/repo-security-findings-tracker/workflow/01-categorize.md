# Workflow 01 — Categorize

> Decide whether the discovery is a SECURITY FINDING or a CLEANUP ITEM. Different files, different urgency, different format. If unclear, walk `decision-trees/finding-vs-cleanup.md`.

---

## Step 1 — Get The Description

> "Quick description of what you found? One or two sentences is enough."

(Wait for operator response.)

---

## Step 2 — Propose Category

Based on the description, propose a category using this rubric:

| If The Description Mentions... | Proposed Category |
|---|---|
| Leaked data (PII, financial, PHI) | SECURITY FINDING |
| Missing input validation | SECURITY FINDING |
| Auth bypass or session issue | SECURITY FINDING |
| Error message exposing internals (stack traces, internal IDs) | SECURITY FINDING |
| SQL injection / XSS / CSRF risk | SECURITY FINDING |
| Sensitive data in logs | SECURITY FINDING |
| Active vulnerability in own code | SECURITY FINDING |
| Dead code, unused variables | CLEANUP ITEM |
| Deprecated framework patterns (sync params in Next 15, etc.) | CLEANUP ITEM |
| Lint warnings, code style | CLEANUP ITEM |
| Documented-but-unused feature plumbing | CLEANUP ITEM |
| Refactor opportunities | CLEANUP ITEM |
| Console.logs left in production code | CLEANUP ITEM (UNLESS they leak sensitive data → FINDING) |
| TODOs and FIXMEs | CLEANUP ITEM |

Present the proposal:

> "Based on your description, this sounds like a **[SECURITY FINDING / CLEANUP ITEM]** because [1-sentence reasoning].
>
> Confirm, or want to discuss?"

If operator hesitates, walk `decision-trees/finding-vs-cleanup.md`.

---

## Step 3 — Route To Capture Workflow

After category is confirmed:

### If SECURITY FINDING

> "Routing to `workflow/02a-capture-finding.md` for the finding capture questions."

### If CLEANUP ITEM

> "Routing to `workflow/02b-capture-backlog.md` for the cleanup item capture questions."

---

## Edge Case: Both Categories

Sometimes a discovery has elements of both — e.g., dead code that COULD have been a security issue if used. Default to the more conservative category:

| Situation | Default Category |
|---|---|
| Dead code that would have been a vuln if active | SECURITY FINDING (mark severity LOW, status FIXED via deletion) |
| Cleanup item that has security implications "down the road" | SECURITY FINDING (better to track in the higher-urgency file) |
| Pure hygiene with zero security angle | CLEANUP ITEM |

When in doubt: SECURITY FINDING. Easier to demote later than to miss something.

---

## Edge Case: Operator Insists On A Category That Doesn't Match

The operator's authority is supreme (family doctrine Section 4.8). If the proposed category is FINDING but the operator wants it in BACKLOG, acknowledge and route per their decision. Note in the entry: "operator-categorized as backlog despite security implication" so the rationale is visible to future readers.

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Operator can't decide category | Genuinely ambiguous | Walk decision-trees/finding-vs-cleanup.md |
| Description is too vague to categorize | Operator gave a one-word response | Ask for more detail before proposing |
| Description mentions a dep vuln | Wrong skill — this is an audit issue | Suggest engaging `repo-security-audit` instead |
| Description is about a deploy/infra issue | Out of scope for this bundle | Suggest tracking in a different ledger (project's main agent_docs) |

---

## Checkpoint

Categorization complete when:

- [ ] Operator has described the discovery
- [ ] Category proposed and confirmed (FINDING or CLEANUP)
- [ ] Routing decision made for next workflow file

Next file (FINDING): `workflow/02a-capture-finding.md`
Next file (CLEANUP): `workflow/02b-capture-backlog.md`
