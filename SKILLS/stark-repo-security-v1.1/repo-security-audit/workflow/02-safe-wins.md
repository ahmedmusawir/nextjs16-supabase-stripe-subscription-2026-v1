# Workflow 02 — Safe Wins (Phase 1)

> Apply `npm audit fix` to soak up the safe, non-breaking patches. NEVER `--force` per family doctrine Section 4.2. State-change phase — requires operator APPROVED before execution.

---

## Step 1 — Dry-Run First (Read-Only)

Before any state change, see what npm wants to do.

> "Phase 1 — Safe Wins. Per family doctrine Section 4.1, even `npm audit fix` is a state change and requires approval. First, the read-only dry-run to preview:
>
> ```bash
> npm audit fix --dry-run 2>&1 | tee /tmp/audit-fix-dryrun.log
> ```
>
> Paste the output — I'll read it back and flag any concerns before we approve the real run."

After the operator pastes the dry-run output:

- Count: how many vulns will be auto-fixed?
- Risk: any unexpected upgrades? Framework changes? Major version jumps?

Report:

> "Dry-run results:
> - Auto-fix will resolve: [N] vulnerabilities
> - Deps to be updated: [list]
> - Major version jumps detected: [list or 'none']
> - Framework changes: [list or 'none']
>
> [If clean] Recommendation: APPROVE the real run. Generates safe patches only, no breaking changes.
>
> [If concerns] CONCERNS: [list]. Recommend stopping here and triaging in Phase 2 instead of letting auto-fix run.
>
> Approve the real `npm audit fix` (no --force)? Or skip Phase 1 and go straight to Phase 2 manual triage?"

---

## Step 2 — Execute (On APPROVED Only)

If operator APPROVED:

> "Run this in your terminal:
>
> ```bash
> npm audit fix
> ```
>
> Paste the output when done. Then we'll re-audit to see what remains."

---

## Step 3 — Re-Audit

After the operator pastes the fix output:

> "Now confirm the new state:
>
> ```bash
> npm audit
> ```
>
> Paste the output."

Parse the new vuln profile:

| Field | Pre-Phase-1 | Post-Phase-1 | Delta |
|---|---|---|---|
| Total | [N] | [N] | [-N] |
| Critical | [N] | [N] | [-N] |
| High | [N] | [N] | [-N] |
| Moderate | [N] | [N] | [-N] |
| Low | [N] | [N] | [-N] |

---

## Step 4 — Quantify The Win (P6)

Per Principle P6 (Quantify Beyond Vuln Count), the headline tally isn't the only metric. Check whether any of the now-resolved vulns eliminated multiple advisories at once:

> "Generate this for accurate impact measurement:
>
> ```bash
> npm ls --depth=0 2>&1 | head -50
> ```
>
> If a dep was removed entirely by audit fix, the CVE-advisory-count eliminated may be larger than the headline vuln reduction. I'll note in the session log."

---

## Step 5 — Verify Build Still Works

CRITICAL: even safe wins can occasionally break a build. Verify before moving on.

> "Verify build still passes after the Phase 1 changes:
>
> ```bash
> npm run build
> ```
>
> Paste the result — success or first error."

If build fails:
- EVIDENCE: report the failure
- Recommend rolling back Phase 1 changes:
  ```bash
  git checkout package.json package-lock.json
  npm ci
  ```
- Skip directly to Phase 2 for manual triage

If build passes:
- EVIDENCE: build green, Phase 1 fix did not regress.
- Proceed.

---

## Step 6 — Bookkeeping Snippet

Generate the Phase 1 snippet for operator to append to the session log:

> "Append to `agent_docs/sessions/session_YYYY-MM-DD.md`:
>
> ```markdown
> ### Phase 1 Safe Wins
> - `npm audit fix` ran (no --force)
> - Vulns resolved: [N]
> - Vulns remaining: [N]
> - Build verification: PASS / FAIL
> - Deps changed: [list]
> ```
>
> Save it, then we proceed to Phase 2 — the critical triage phase."

---

## Step 7 — Decision Point

If 0 vulns remain after Phase 1:

> "Phase 1 cleared all remaining vulnerabilities. Skipping Phase 2 triage and Phase 3 execution.
>
> Recommendation: proceed directly to Phase 4 (Bookkeeping) and Phase 5 (Re-Baseline). The audit is essentially done. Approve?"

If vulns remain:

> "Phase 1 reduced from [N pre] to [N post]. Moving to Phase 2 — triage each remaining vuln individually using the P2 hierarchy (Remove > Replace > Upgrade > Patch). This is the critical phase. Ready?"

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Dry-run shows framework downgrade | npm wants to apply `--force`-level fix that isn't actually --force-only | HALT, refuse approval, go to Phase 2 manual triage |
| `npm audit fix` resolves 0 vulns | All remaining are non-trivial (transitive, locked parents, breaking upgrades) | Expected — move directly to Phase 2 |
| Build breaks after fix | A non-breaking patch was actually breaking | Roll back, manual triage in Phase 2 |
| New vulns appeared post-fix | Dep tree shifted, new deps introduced | Investigate; usually a parent upgrade pulled in a new vulnerable transitive |

---

## Checkpoint

Phase 1 complete when:

- [ ] Dry-run executed and reviewed
- [ ] Operator APPROVED the real `npm audit fix` (or chose to skip)
- [ ] Fix output captured
- [ ] Re-audit confirms new vuln count
- [ ] Build verification PASS
- [ ] Session log snippet generated for operator
- [ ] Operator confirms ready for Phase 2 (or audit complete if 0 vulns)

Next file: `workflow/03-triage.md`
