# Workflow 05 — Bookkeeping (Phase 4)

> Per Principle P4 (Bookkeeping Is Mandatory): if it's not in the books, it didn't happen. Update CHANGELOG, session log, RECOVERY.md. Generate snippets — operator pastes them.

---

## Step 1 — CHANGELOG.md Entry

Read the project's current CHANGELOG.md to find the `[Unreleased]` section.

```bash
test -f CHANGELOG.md && head -30 CHANGELOG.md || echo "CHANGELOG.md NOT FOUND"
```

If CHANGELOG.md doesn't exist, recommend creating it with the operator's approval.

Generate the entry for operator to paste under `[Unreleased]`:

> "Append under `[Unreleased]` in CHANGELOG.md:
>
> ```markdown
> ### Security
>
> - Removed unused `<DEP>` — eliminated [N] CVE advisories from dep graph
> - Upgraded `<DEP>` `<OLD>` → `<NEW>` — patches CVE-YYYY-NNNNN (severity: [LEVEL])
> - Overrode transitive `<DEP>` to `<SAFE>` via npm overrides — parent pins vulnerable version (per P8)
> - Applied `npm audit fix` — auto-patched [N] safe wins
>
> ### Removed
>
> - `<DEP>` — unused dependency, removed during YYYY-MM-DD security audit (zero imports across source)
> ```
>
> Use only the bullets that apply — drop the rest. Paste into CHANGELOG.md, save."

For full template structure, reference `references/DECISION_TEMPLATES.md`.

---

## Step 2 — Session Log Entry

Append the full audit record to today's session log:

> "Append to `agent_docs/sessions/session_YYYY-MM-DD.md`:
>
> ```markdown
> ## Security Audit — YYYY-MM-DD
>
> **Operator:** Tony
> **Skill:** repo-security-audit v1.0
> **Safety branch:** `security-audit-YYYY-MM-DD`
>
> ### Threat-landscape check (P11)
> - Performed: YYYY-MM-DD HH:MM
> - Active threats: [yes/no — list if yes]
> - Project overlap: [yes/no]
> - Decision: PROCEED
>
> ### Vulnerability profile
> - **Phase 0 baseline:** [N] total ([C critical] / [H high] / [M moderate] / [L low])
> - **Phase 1 after safe wins:** [N] total
> - **Phase 5 final:** 0 vulnerabilities (or [N] ACCEPTed)
> - **CVE advisories eliminated:** [N] (per P6 quantification)
>
> ### Decisions executed
> | # | Dep | Decision | Outcome |
> |---|---|---|---|
> | 1 | [dep] | REMOVE | [-N] CVE advisories eliminated |
> | 2 | [dep] | UPGRADE [old] → [new] | Non-breaking, build clean |
> | 3 | [dep] | OVERRIDE to [safe] | Per P8, parent pin confirmed |
>
> ### Tangential findings captured
> - [N] entries to `agent_docs/security/SECURITY_FINDINGS.md`
> - [N] entries to `agent_docs/security/CLEANUP_BACKLOG.md`
>
> ### Final state
> - `npm audit`: 0 vulnerabilities ✅
> - `npm run build`: PASS ✅
> - `npm test`: PASS ✅
> - Bookkeeping: CHANGELOG / session log / RECOVERY.md ✅
> ```
>
> Save it."

---

## Step 3 — RECOVERY.md Update

Update the project's `RECOVERY.md` last-action pointer (if the project uses one).

```bash
test -f RECOVERY.md && head -20 RECOVERY.md || echo "RECOVERY.md NOT FOUND"
```

If exists, generate the update:

> "Replace the `## Last Action` section in RECOVERY.md with:
>
> ```markdown
> ## Last Action
>
> **Date:** YYYY-MM-DD
> **Action:** Security audit completed. Repo at 0 vulnerabilities.
> **Safety branch:** `security-audit-YYYY-MM-DD` (ready to merge to main)
> **Lockfile:** authoritative (regenerated from clean package.json if overrides applied)
> **Next:** Merge safety branch when ready, then resume planned work.
> ```
>
> Paste, save."

If RECOVERY.md doesn't exist, skip — not all projects use one.

---

## Step 4 — Commit The Audit Changes

Recommend the commit, but per family doctrine Section 4.1, the operator runs git commands explicitly.

> "Per P5 and P10, commit the audit changes to the safety branch:
>
> ```bash
> git add package.json package-lock.json CHANGELOG.md \
>         agent_docs/sessions/session_YYYY-MM-DD.md \
>         RECOVERY.md
> git status
> ```
>
> Paste `git status` output to confirm only expected files are staged. Then if clean:
>
> ```bash
> git commit -m 'Security audit YYYY-MM-DD: 0 vulnerabilities (was: [N])'
> ```
>
> Approve before run?"

After commit:

```bash
git log -1 --stat
```

EVIDENCE check: commit message matches, changed files match expectations.

---

## Step 5 — DO NOT Merge Yet

Per family doctrine, the audit produces a safety branch, not a main-branch commit.

> "Do NOT merge to main automatically. Per P5 (Safety Branch Always) and Section 4.1 (Read-Only Until Approved), merging is a separate decision.
>
> Recommendation: open a PR for review, OR if working solo, run a final manual test pass against the safety branch before merge. The branch can sit pending review.
>
> The audit skill is complete after Phase 5 verification. Merge timing is operator's call."

---

## Step 6 — Final Bookkeeping Verification

Confirm all three places updated:

```bash
grep -A 3 "^### Security" CHANGELOG.md | head -10
test -f agent_docs/sessions/session_YYYY-MM-DD.md && head -5 agent_docs/sessions/session_YYYY-MM-DD.md
test -f RECOVERY.md && grep -A 2 "^## Last Action" RECOVERY.md | head -5 || echo "RECOVERY.md skipped"
```

EVIDENCE check: each location shows today's audit entry.

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| CHANGELOG.md doesn't exist | New project, no changelog convention yet | Recommend creating one with Keep-A-Changelog format |
| Session log directory missing | First session in this project | Create `agent_docs/sessions/` with operator approval |
| RECOVERY.md doesn't exist | Project doesn't use the pointer pattern | Skip — not all projects do |
| Operator skips bookkeeping | "I'll do it later" | Surface P4 doctrine: if not in the books, it didn't happen. Audit not complete until updates done. |

---

## Checkpoint

Phase 4 complete when:

- [ ] CHANGELOG.md updated with security entry
- [ ] Session log appended with full audit record
- [ ] RECOVERY.md last-action pointer updated (or skipped if not used)
- [ ] Audit commit created on safety branch
- [ ] All bookkeeping verified via grep
- [ ] Operator confirms ready for Phase 5 re-baseline

Next file: `workflow/06-re-baseline.md`
