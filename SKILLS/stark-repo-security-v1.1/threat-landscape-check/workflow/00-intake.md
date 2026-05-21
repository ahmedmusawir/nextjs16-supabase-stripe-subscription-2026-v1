# Workflow 00 — Intake

> Confirm read-only posture, let the operator pick output level, confirm scope. This phase is pure conversation — no commands run, no files read beyond what was already gathered at family activation.

---

## Step 1 — Confirm Read-Only Posture

State the skill's identity clearly so the operator knows what's about to happen:

> "Engaging Path A — threat-landscape-check. Quick orientation before we start:
>
> This skill is **pure research**. I will:
> - Read `package.json` (read-only)
> - Run web searches for threat-landscape data
> - Run `npm view <package>` commands (read-only registry queries)
> - Generate a report
>
> I will NOT:
> - Install, modify, or update any dep
> - Edit `package.json` or `package-lock.json`
> - Run `git` mutations or make commits
> - Apply any fixes
>
> If something concerning surfaces, I'll surface it and let you decide what to do (including optionally logging a finding via the findings-tracker skill).
>
> Sound good? Or any questions about scope before we begin?"

Wait for operator acknowledgement. If they ask "wait, can you also do X?" where X is a state change — redirect: "X is outside this skill's mandate. After the threat-check is complete, the appropriate next skill is [audit / findings-tracker / manual operator action]."

---

## Step 2 — Pick Output Level

Present the three options for output verbosity. Operator picks.

> "Output level for the report — your call:
>
> **1. Tight (1 line per dep + 1-line rollup)**
> Each dep gets icon + name + verdict + one-sentence reason. Repo rollup is a single summary line.
> Use when: hurried, mid-flow, just want the headline.
>
> **2. Standard (3-5 lines per dep + brief rollup)**
> Each dep gets verdict + main concern + recommendation. Rollup includes HALT details and CAUTION roll-up.
> Use when: starting a session, want enough detail to act on but not exhaustive.
>
> **3. Thorough (full card per dep + detailed rollup)**
> Each dep gets verdict + advisories + maintainer status + downloads + sources. Rollup includes alternatives discussion and monitoring suggestions.
> Use when: deep hygiene check, sharing with team, building a record for the project.
>
> Which?"

Capture the chosen level. Use it consistently throughout the run.

---

## Step 3 — Confirm Scope

For v1 of this skill, scope is **direct deps in `package.json`** (`dependencies` + `devDependencies`). Confirm this is what the operator wants:

> "Scope confirmation: I'll research the **direct dependencies** in `package.json` — both `dependencies` and `devDependencies`. I will NOT scan transitive deps individually (that's the audit's job — transitive vulnerabilities show up in `npm audit` differently).
>
> Confirm direct-deps-only, or do you want a narrower scope (e.g., dependencies only, or a specific list)?"

Common scoping responses:
- **"Direct deps, both lists"** → default scope, proceed
- **"Dependencies only, skip devDeps"** → narrow scope, note in report
- **"Just these three: X, Y, Z"** → restricted scope; treat as a custom list

Whatever the operator picks, capture it and stick with it through the run.

---

## Step 4 — Confirm Optional Report Save

Per family doctrine Section 4.1, even writing a report file is a state change requiring approval. Ask up front:

> "Want me to also generate a report file at `agent_docs/security/threat-checks/YYYY-MM-DD-threat-check.md`?
>
> - **Yes** — I'll create the file content at the end; you paste and save (file-path-not-dump rule)
> - **No** — chat output only, no file
>
> Either way, the chat will get the full report at your chosen output level."

Capture the answer. If yes, plan to generate the file content at Phase 3 end.

---

## Step 5 — Plan Mode Summary

Before moving to Phase 1, present a plan:

> "Plan for this threat-landscape check:
>
> - **Scope:** [direct deps both lists / dependencies only / custom list]
> - **Output level:** [Tight / Standard / Thorough]
> - **Report file save:** [yes → agent_docs/security/threat-checks/ / no, chat only]
> - **Research vectors per dep:** (1) recent advisories, (2) supply-chain attacks, (3) maintainer changes, (4) typosquat similarity
> - **No state changes** beyond optional report file paste
>
> Awaiting your APPROVED before proceeding to target discovery."

Wait for explicit APPROVED. Then move to `workflow/01-target-discovery.md`.

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Operator wants to skip intake and "just go" | Time pressure | Surface family doctrine 4.4 (Plan Mode First) — even research benefits from a 30-second plan. Compress the questions but don't skip. |
| Operator asks for installation help | Wrong skill | Redirect: this skill is research-only. Suggest the audit skill or manual install with operator-driven flow. |
| Operator asks to scan transitive deps | Scope creep | Surface: transitive vulns are the audit's job (`npm audit` handles them natively). Threat-check stays on direct deps + supply-chain news. |
| Operator says "do it for all my repos" | Out of scope | This skill scans one repo per invocation. Multi-repo monitoring is a future infrastructure tool (`threat-monitor`), not a Stark Skill. |

---

## Checkpoint

Intake complete when:

- [ ] Read-only identity stated and operator acknowledged
- [ ] Output level chosen (Tight / Standard / Thorough)
- [ ] Scope confirmed (default or custom)
- [ ] Report file save decision captured (yes / no)
- [ ] Plan Mode summary presented
- [ ] Operator APPROVED to proceed

Next file: `workflow/01-target-discovery.md`
