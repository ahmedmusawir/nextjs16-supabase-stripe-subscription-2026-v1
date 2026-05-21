# Workflow 00 — Pre-Flight

> Phase 0 prerequisites before any baseline capture. Read-only inspection plus the P11 threat-landscape check. Per family doctrine Section 4.1, no changes to the repo without operator APPROVED.

---

## Step 1 — Repo Confirmation

Before touching anything, confirm with the operator:

> "Pre-flight check. Confirm the following from environment discovery output:
> - Repo path: [output of pwd from activation]
> - Current branch: [output of git branch --show-current]
> - Working tree clean: [yes/no — if no, recommend stash or commit first]
> - Session log for today started: [yes/no — recommend starting one if not]
>
> Anything to correct before I proceed?"

If working tree is dirty (uncommitted changes), do NOT proceed. Recommend:

```bash
git stash push -m "pre-audit stash YYYY-MM-DD"
```

Or commit current work first. Audit must start from a clean working tree.

---

## Step 2 — Threat-Landscape Check (P11)

This is a doctrine-mandated read-only check before any install activity.

> "Per family doctrine Section 6.4 (Principle P11), I need to run a 60-second threat-landscape check before any install command. I'll web-search for active npm supply-chain attacks affecting:
> - This project's direct deps (top 10 by criticality from package.json)
> - The past 7 days of npm advisory feed
>
> This is read-only — no changes to the repo. Approve?"

After APPROVED, run web searches with these patterns:

```
npm supply chain attack [current month] [current year]
[top-dep-name] npm vulnerability [current year]
npm malicious package [current month]
```

Report findings:

| Finding Type | Active Threats | Project Overlap |
|---|---|---|
| Supply-chain attacks (past 7 days) | [list or "none found"] | [yes/no per match] |
| Critical advisories (past 30 days) | [list or "none found"] | [yes/no per match] |
| Recommendation | PROCEED / HALT | — |

If HALT recommended (active threat overlaps a project dep), stop the audit. Surface to operator for decision: pin a safe version first, or proceed with eyes open.

---

## Step 3 — Safety Branch

Per Principle P5 (Safety Branch Always), every audit runs on a dedicated branch.

> "Recommend creating a safety branch before any dep changes. Proposed name: `security-audit-YYYY-MM-DD`.
>
> Per family doctrine Section 4.1, creating a branch IS a state change — even though it's safe, surfacing it for explicit approval. Approve?"

After APPROVED, run:

```bash
git checkout -b security-audit-YYYY-MM-DD
```

Verify with:

```bash
git branch --show-current
```

EVIDENCE check: confirms branch matches `security-audit-YYYY-MM-DD`.

---

## Step 4 — Tooling Sanity

Confirm the audit toolchain is available before Phase 1:

```bash
node --version
npm --version
test -f package.json && echo "package.json EXISTS" || echo "MISSING — HALT"
test -f package-lock.json && echo "package-lock.json EXISTS" || echo "MISSING — RECOMMEND GENERATING"
```

If `package-lock.json` is missing, recommend regenerating before audit:

> "No package-lock.json detected. Per P10 (Lockfile Is The Propagation Mechanism), the audit needs an authoritative lockfile. Recommend running `npm install` to generate one before baseline capture. This is a state change — approve?"

Wait for explicit approval before any `npm install` runs.

---

## Step 5 — Plan Mode Summary

Before moving to Phase 1, present a plan:

> "Pre-flight complete. Ready to begin audit with the following plan:
>
> - Repo: [path] on branch `security-audit-YYYY-MM-DD`
> - Threat-landscape check: [PROCEED / HALT details]
> - Tooling: node [version], npm [version], lockfile present
> - Phase 1 next: `npm audit` baseline capture (read-only)
> - Phase 2 after: `npm audit fix` for safe wins (requires approval before run)
>
> Total estimated phases: 5 more after this one. Each gates the next.
>
> Awaiting your APPROVED before proceeding to Phase 1."

Wait for explicit APPROVED. Then move to `workflow/01-baseline.md`.

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Working tree dirty | Uncommitted changes from prior work | Stash or commit, do NOT proceed |
| No git repo detected | Skill activated outside a git project | Confirm operator intent — audit without VCS protection is risky |
| Threat-landscape shows active threat on a top dep | Real supply-chain attack in flight | HALT, surface to operator with options |
| `node_modules` missing entirely | Fresh clone, deps never installed | Recommend `npm install` first (with approval) |

---

## Checkpoint

Pre-flight complete when:

- [ ] Repo path, branch, clean tree confirmed
- [ ] P11 threat-landscape check executed, results reported
- [ ] Safety branch created and verified
- [ ] Tooling sanity (node/npm/package.json/lockfile) confirmed
- [ ] Plan Mode summary presented
- [ ] Operator APPROVED to proceed to Phase 1

Next file: `workflow/01-baseline.md`
