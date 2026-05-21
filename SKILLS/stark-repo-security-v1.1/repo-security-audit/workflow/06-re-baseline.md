# Workflow 06 — Re-Baseline (Phase 5)

> Final verification. Confirm the audit achieved its goal: clean repo, clean build, clean tests, all bookkeeping in place. Read-only — just verification commands.

---

## Step 1 — Final Audit Confirmation

> "Phase 5 — final verification. Read-only commands:
>
> ```bash
> npm audit
> ```
>
> Paste output."

EVIDENCE check:
- Expected: `found 0 vulnerabilities`
- If ACCEPTed vulns documented: expected matches the ACCEPT count
- If unexpected vulns appear: STOP — something regressed in Phase 3, investigate

---

## Step 2 — Build Verification

```bash
rm -rf .next  # per G-NPM-2 anti-pattern, force a clean build
npm run build
```

EVIDENCE check: build completes without errors. If using Next.js, verify the `routes-manifest.json` exists post-build.

---

## Step 3 — Test Verification

```bash
npm test
```

EVIDENCE check: tests pass. If tests aren't configured or are out of scope:
> "No test suite present, or operator confirmed tests out of scope for this audit. Documented in session log."

---

## Step 4 — Lockfile Authority Check (P10)

Confirm the lockfile is authoritative for downstream environments:

```bash
test -f package-lock.json && wc -l package-lock.json
git status package-lock.json
```

EVIDENCE check:
- Lockfile exists
- Lockfile is committed (not in modified or untracked state)
- Per P10, `npm ci` from this lockfile will produce an identical tree in any downstream environment

---

## Step 5 — Bookkeeping Cross-Check

Confirm all required artifacts exist:

```bash
echo "--- CHANGELOG ---"
grep -A 5 "^### Security" CHANGELOG.md | head -10

echo "--- SESSION LOG ---"
test -f agent_docs/sessions/session_YYYY-MM-DD.md && head -5 agent_docs/sessions/session_YYYY-MM-DD.md

echo "--- RECOVERY (if used) ---"
test -f RECOVERY.md && grep -A 2 "^## Last Action" RECOVERY.md | head -5 || echo "Not used in this project"

echo "--- LEDGER (any findings captured) ---"
test -d agent_docs/security && ls agent_docs/security/
```

EVIDENCE check: each location shows today's audit, ledger files exist if findings were captured.

---

## Step 6 — Safety Branch Status

```bash
git branch --show-current
git log -3 --oneline
git status
```

EVIDENCE check:
- Current branch: `security-audit-YYYY-MM-DD`
- Recent commits include the audit commit
- Working tree clean (no uncommitted changes)

---

## Step 7 — Final Report

Present the close-out summary:

> "**Audit complete.** Final state:
>
> | Check | Result |
> |---|---|
> | `npm audit` | 0 vulnerabilities ✅ (or N ACCEPTed) |
> | `npm run build` | PASS ✅ |
> | `npm test` | PASS ✅ (or N/A — documented) |
> | Lockfile authoritative | YES ✅ |
> | CHANGELOG updated | YES ✅ |
> | Session log updated | YES ✅ |
> | RECOVERY.md updated | YES / SKIPPED |
> | Safety branch ready | `security-audit-YYYY-MM-DD` ✅ |
> | Tangential findings logged | [N] findings, [N] backlog items |
>
> **Next steps (operator decisions):**
> 1. Review the safety branch (`git log security-audit-YYYY-MM-DD`)
> 2. Open a PR if working in a team, or merge directly if working solo
> 3. After merge, delete the safety branch (`git branch -d security-audit-YYYY-MM-DD`)
> 4. If `pre-install-threat-check/` placeholder is later implemented, future installs go through that gate
>
> Skill close-out complete. Returning to standby."

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Final `npm audit` shows vulns not in Phase 0 | Regression — new vulns introduced by changes | Investigate; usually a parent upgrade pulled in a new transitive |
| Build fails on final verify | Caches stale, or hidden incompatibility | `rm -rf .next node_modules && npm ci && npm run build` |
| Tests fail final verify | Behavior change in upgraded dep wasn't caught | Investigate the specific failing test; may need code fix |
| Lockfile shows as modified | Uncommitted edits to lockfile | Commit them as part of audit, re-run Step 4 |
| Safety branch has uncommitted changes | Phase 4 bookkeeping not committed | Return to workflow/05-bookkeep.md Step 4, complete commit |

---

## Checkpoint — Audit Skill Complete

Phase 5 complete when ALL true:

- [ ] `npm audit` reports 0 vulns (or N ACCEPTed and documented)
- [ ] `npm run build` PASS
- [ ] `npm test` PASS (or out of scope, documented)
- [ ] Lockfile present, committed, authoritative
- [ ] CHANGELOG, session log, RECOVERY.md (if used) all updated
- [ ] Safety branch contains the audit commit
- [ ] Working tree clean
- [ ] Tangential findings captured in `agent_docs/security/` (via findings-tracker skill)
- [ ] Operator confirms close-out

If ALL true: declare audit complete, return to standby.

If any FALSE: surface the gap, walk back to the relevant phase.

---

## Done. Standing By.

Audit closed. The bundle returns to passive state — no further skill activity until the operator activates again (audit, finding capture, status update, or pre-install threat check placeholder).

🛡️
