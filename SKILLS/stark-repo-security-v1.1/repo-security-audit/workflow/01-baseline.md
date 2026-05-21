# Workflow 01 — Baseline Capture (Phase 0)

> Capture the starting vulnerability profile. Read-only — `npm audit` reports state, does not change it.

---

## Step 1 — Generate The Baseline Command

Read-only per family doctrine. No operator approval needed for the command itself; just present it for the operator to run.

> "Generating the baseline audit command. Please paste this in your terminal at the repo root and share the output:
>
> ```bash
> npm audit
> ```
>
> If the output is long, also run:
>
> ```bash
> npm audit --json > /tmp/audit-baseline-YYYY-MM-DD.json
> echo 'Saved to /tmp/audit-baseline-YYYY-MM-DD.json'
> ```
>
> For the JSON version, paste the summary block (the `metadata` field) — or share the file."

---

## Step 2 — Parse The Output

After the operator pastes the output, extract:

| Field | Value |
|---|---|
| Total vulnerabilities | [number] |
| Critical | [number] |
| High | [number] |
| Moderate | [number] |
| Low | [number] |
| Total deps in tree | [number from "X dependencies"] |
| Top offenders (by severity, then name) | [list 3-5] |

If the output shows 0 vulnerabilities:

> "EVIDENCE: `npm audit` reports 0 vulnerabilities. This repo is already clean.
>
> Recommendation: skip Phases 1–4 (no work to do), proceed directly to Phase 5 re-baseline confirmation, and produce a session log noting 'audit baseline already clean.' Approve?"

If vulnerabilities exist, continue to Step 3.

---

## Step 3 — Categorize Direct vs Transitive

Generate this command for the operator to run, to understand where the vulns live:

```bash
npm audit --json | jq -r '.vulnerabilities | to_entries[] | "\(.key): \(.value.severity) (\(.value.isDirect|tostring))"' 2>/dev/null || npm audit
```

(Fallback to plain `npm audit` if `jq` not available — parse manually from output.)

After paste, classify each vuln:

| Dep Name | Severity | Direct? | Parent (if transitive) |
|---|---|---|---|
| [name] | [level] | yes/no | [parent dep or — ] |

This matters because per **P3 (Direct vs Transitive)**, the fix strategy differs:
- **Direct vuln** → UPGRADE / REMOVE / REPLACE candidates
- **Transitive vuln** → check parent first (does parent's newer version still pin it?), then OVERRIDE if stuck

---

## Step 4 — Baseline Report To Operator

Present a clean summary:

> "Phase 0 baseline captured.
>
> **Vulnerability profile:**
> - Total: [N]
> - Critical: [N] | High: [N] | Moderate: [N] | Low: [N]
>
> **Direct vs Transitive split:**
> - Direct: [N] (will need UPGRADE / REMOVE / REPLACE decisions)
> - Transitive: [N] (will need parent investigation per P3)
>
> **Top offenders:**
> - [dep1] ([severity], [direct/transitive])
> - [dep2] ([severity], [direct/transitive])
> - [dep3] ([severity], [direct/transitive])
>
> **Next: Phase 1 — Safe Wins.** I'll generate the `npm audit fix` command (NEVER `--force` per family doctrine Section 4.2). This is a state-change command and requires your explicit APPROVED before running. After Phase 1, we'll triage what's left.
>
> Ready to move to Phase 1?"

---

## Step 5 — Save Baseline For Phase 5 Comparison

Generate the bookkeeping snippet for the operator to paste into today's session log:

> "Append this to your session log at `agent_docs/sessions/session_YYYY-MM-DD.md`:
>
> ```markdown
> ## Security Audit — YYYY-MM-DD
>
> ### Phase 0 Baseline
> - Total vulns: [N]
> - Critical: [N] | High: [N] | Moderate: [N] | Low: [N]
> - Direct: [N] | Transitive: [N]
> - Safety branch: security-audit-YYYY-MM-DD
> - Threat-landscape check: PROCEED / [details]
> ```
>
> Save it, then we proceed to Phase 1."

Per family doctrine Section 4.1, even writing to a session log is a state change. The operator pastes; the operator owns the write.

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| `npm audit` reports 0 vulns but `package-lock.json` is stale | Lockfile out of sync with package.json | Regenerate lockfile (`rm package-lock.json && npm install`) with approval, re-baseline |
| Many vulns in one transitive dep, all from same parent | Single upstream issue cascading | Note for Phase 2 — likely an OVERRIDE candidate |
| Audit hangs / timeouts | Network issue, npm registry slow | Retry; if persistent, surface to operator |
| Output reports "found 0 vulnerabilities" but `--json` shows entries | Severity threshold mismatch | Use `--json` for ground truth; plain text may filter LOW |

---

## Checkpoint

Phase 0 baseline complete when:

- [ ] `npm audit` output captured from operator paste
- [ ] Vulnerability counts categorized by severity
- [ ] Direct vs Transitive split documented
- [ ] Baseline summary report delivered to operator
- [ ] Session log snippet generated for operator to paste
- [ ] Operator confirms ready for Phase 1

Next file: `workflow/02-safe-wins.md`
