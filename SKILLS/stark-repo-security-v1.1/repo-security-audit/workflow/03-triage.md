# Workflow 03 — Triage (Phase 2)

> The critical phase. For each remaining vulnerability, decide: REMOVE / REPLACE / UPGRADE / OVERRIDE / ACCEPT. Per Principle P2 (Remove > Replace > Upgrade > Patch). Read-only inspection per vuln; final decision table requires operator APPROVED before Phase 3 execution.

---

## How This Phase Works

For each remaining vuln, walk through Steps 1–5 in this file. Then produce a consolidated decision table (Step 6) for operator approval before Phase 3.

Inspection in this phase is read-only (grep, npm ls, npm view). No state changes. Decisions are proposals only until the table is approved.

If the operator hesitates on any single decision, walk the appropriate decision tree:
- `decision-trees/remove-vs-upgrade.md`
- `decision-trees/direct-vs-transitive.md`
- `decision-trees/override-vs-migrate.md`

---

## Step 1 — Usage Check (Source Imports)

For each remaining vuln'd dep, generate the grep command:

```bash
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
     --include="*.mjs" --include="*.cjs" \
     -E "(from\s+['\"]<DEP>['\"]|require\(['\"]<DEP>['\"]\)|import.*<DEP>)" . \
  | grep -v node_modules | grep -v ".next/" | grep -v dist/
```

Operator runs, pastes output. Count the import sites.

---

## Step 2 — Doc & Test Check

Confirm the dep isn't only mentioned in docs (which would suggest aspirational install):

```bash
grep -rn --include="*.md" "<DEP>" . | grep -v node_modules
grep -rn --include="*.test.*" --include="*.spec.*" "<DEP>" . | grep -v node_modules
```

---

## Step 3 — Direct vs Transitive (P3)

Generate the direct/transitive check:

```bash
npm ls <DEP>
```

If the output shows the dep at the top level (e.g., `your-project@1.0.0`), it's **direct**.
If it's nested (e.g., `└── some-parent@x.y.z`), it's **transitive** — investigate the parent.

For transitive vulns, run the P3 parent check:

```bash
# Does the parent's current version pin the vulnerable transitive?
npm view <PARENT>@<CURRENT_VERSION> dependencies.<DEP>

# Does the parent's LATEST version still pin it?
npm view <PARENT>@latest dependencies.<DEP>
```

EVIDENCE matrix:

| Parent Latest Pins Vulnerable? | Action |
|---|---|
| No — parent latest drops it or uses safe version | UPGRADE PARENT |
| Yes — parent latest still pins the vulnerable version | OVERRIDE candidate (P8) |
| Parent has no newer version available | OVERRIDE or ACCEPT |

---

## Step 4 — Propose A Decision

Based on Steps 1–3, propose ONE of these decisions per vuln:

| Usage Pattern | Proposed Decision | Rationale |
|---|---|---|
| 0 imports anywhere | **REMOVE** | The dep you don't use is the vuln you don't need |
| Only in docs/examples | **REMOVE** | Aspirational install, no live code dependency |
| 1–2 imports, native API available | **REPLACE + REMOVE** | e.g., axios → native fetch |
| Pervasive, non-breaking patch exists | **UPGRADE** | Standard `npm install <dep>@<safe>` |
| Pervasive, breaking upgrade only | **PLAN MIGRATION** | Separate effort, not in this audit |
| Transitive, parent updateable | **UPGRADE PARENT** | Fixes the transitive |
| Transitive, parent pinned | **OVERRIDE** (P8) | npm overrides forces safe version |
| Transitive, no override, no parent fix | **ACCEPT** with rationale | Document the risk |

Present each proposal to the operator:

> "Vuln: `<DEP>` ([severity], [direct/transitive])
>
> Findings:
> - EVIDENCE: [N] imports in source ([files])
> - EVIDENCE: [N] doc references
> - EVIDENCE: [direct OR transitive via PARENT]
> - [If transitive] EVIDENCE: parent latest [still pins | drops] vulnerable version
>
> Proposed decision: **[DECISION]** — [reasoning in 1 sentence]
>
> Approve this proposal? Or want to discuss alternatives?"

If operator hesitates, walk the relevant decision tree.

---

## Step 5 — Per-Vuln Decision Record

After each approval (or rejection), keep a running record for the final consolidated table:

| # | Dep | Severity | Direct/Trans | Decision | Rationale |
|---|---|---|---|---|---|
| 1 | [dep] | [sev] | [d/t] | [DECISION] | [1-line reason] |
| 2 | [dep] | [sev] | [d/t] | [DECISION] | [1-line reason] |
| ... | | | | | |

---

## Step 6 — Consolidated Decision Table (REQUIRES OPERATOR APPROVED)

After all remaining vulns are triaged, present the consolidated table:

> "Phase 2 triage complete. Consolidated decision table:
>
> [table from Step 5]
>
> **Execution plan for Phase 3:**
> - REMOVE: [N] deps
> - UPGRADE: [N] deps
> - OVERRIDE: [N] deps
> - REPLACE: [N] deps
> - ACCEPT: [N] deps (documented in session log)
> - MIGRATION DEFERRED: [N] deps (separate effort)
>
> Each decision will be executed one at a time in Phase 3 with build verification between steps (P7).
>
> **Approve the full decision table to proceed to Phase 3?**"

Wait for explicit APPROVED on the consolidated table. Per family doctrine Section 4.1, no execution begins until this approval is in hand.

---

## Step 7 — Session Log Snippet

Generate for operator to paste:

> "Append to `agent_docs/sessions/session_YYYY-MM-DD.md`:
>
> ```markdown
> ### Phase 2 Triage
>
> [insert consolidated table]
>
> **Execution plan approved:** [yes/no, date/time]
> ```
>
> Save it, then we proceed to Phase 3 execution."

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Operator wants to UPGRADE despite REMOVE proposal | Believes dep will be used soon | OK to accept — document in rationale that it's planned use |
| Operator wants to skip triage on a low-severity vuln | Fatigue or time pressure | OK to ACCEPT with documented rationale; don't silently skip |
| Override target version isn't available on npm | Wrong version pinned in proposal | Re-check `npm view <dep> versions` and adjust |
| Transitive vuln has 4+ parents | Multiple deps pin the same vulnerable transitive | OVERRIDE is the right call — single fix point |

---

## Checkpoint

Phase 2 triage complete when:

- [ ] Every remaining vuln has a triage row (Steps 1–4)
- [ ] Each row has a proposed decision and rationale
- [ ] Decision trees walked for any operator hesitation
- [ ] Consolidated decision table presented
- [ ] Operator APPROVED the full table for Phase 3
- [ ] Session log snippet generated

Next file: `workflow/04-execute.md`
