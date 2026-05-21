# Workflow 03 — Report

> Generate the report at the operator-chosen output level. Deliver in PARTS if long. Offer findings-tracker handoff for HALTs. Optionally generate report file content. Close out skill.

---

## Step 1 — Active-Attack Alerts (Always First If Any)

If any HALT verdict was triggered by an active supply-chain attack (Vector 2), this goes at the **top of the report regardless of chosen output level**. Active threats are not negotiable on visibility.

Format:

```markdown
🚨 **ACTIVE ATTACK ALERT** 🚨

**Dep:** `<dep-name>` @ `<installed-version>`
**Attack:** [1-sentence description of the attack]
**Affected versions:** [range]
**Your installed version:** [in range / not in range / adjacent — likely safe but verify]
**Source:** [URL]
**Date reported:** [YYYY-MM-DD]

**Recommended actions:**
1. [specific action — pin version, hold off install, etc.]
2. Log as CRITICAL finding via repo-security-findings-tracker (Path C)
3. Re-run threat-landscape-check in [N days] to verify resolution

```

If no active attacks: skip this section entirely.

---

## Step 2 — Generate Report At Chosen Output Level

Use the appropriate format below for the level chosen at intake.

### Tight Output Format

```markdown
📊 **Threat-Landscape Check — [PROJECT_NAME] — [YYYY-MM-DD]**

Direct deps scanned: [N] | Scope: [default / custom]

✅ next@15.4.1 — PROCEED
✅ @supabase/supabase-js@2.45.3 — PROCEED
⚠️ axios@1.6.2 — CAUTION (1 moderate advisory past 90d)
🛑 some-lib@2.1.0 — HALT (active attack May 2026)
... [more] ...

**Rollup:** [N] PROCEED / [N] CAUTION / [N] HALT
**Audit-readiness:** [PROCEED / PROCEED WITH NOTES / HALT]
**Sources cited:** [N URLs — listed below]

Sources:
- <URL for each CAUTION/HALT>
```

One line per dep. One-line rollup. Source URLs as a list at the bottom.

### Standard Output Format

```markdown
📊 **Threat-Landscape Check — [PROJECT_NAME] — [YYYY-MM-DD]**

**Scope:** [N] direct deps ([N] dependencies + [N] devDependencies)
**Output level:** Standard
**Research vectors:** advisories | supply-chain | maintainers | typosquat

---

## HALT ([N] dep(s))

### 🛑 some-lib@2.1.0
- **Concern:** Active supply-chain attack reported [date], affecting versions [range]
- **Recommendation:** [specific action]
- **Source:** [URL]

[repeat for each HALT]

## CAUTION ([N] dep(s))

### ⚠️ axios@1.6.2
- **Concern:** 1 moderate-severity advisory published [date] — [brief description]
- **Recommendation:** Document during next audit; not deploy-blocking
- **Source:** [URL]

[repeat for each CAUTION]

## PROCEED ([N] dep(s))

Listed without details — no concerning signals across all four vectors:
- next@15.4.1, @supabase/supabase-js@2.45.3, @supabase/ssr@0.5.1, zod@3.22.4, react@18.3.1, ... [more]

---

## Rollup

- **Counts:** [N] PROCEED / [N] CAUTION / [N] HALT
- **Audit-readiness:** [PROCEED / PROCEED WITH NOTES / HALT]
- **Active-attack alerts:** [yes/no — see top of report if yes]
- **Recommended next:** [proceed to audit / resolve HALTs first / log CAUTIONs and proceed]
```

3-5 lines per dep that needs attention. PROCEED items get a one-line summary list. Rollup with action.

### Thorough Output Format

```markdown
📊 **Threat-Landscape Check — [PROJECT_NAME] — [YYYY-MM-DD]**

**Scope:** [N] direct deps ([N] dependencies + [N] devDependencies)
**Output level:** Thorough
**Research vectors:** advisories | supply-chain | maintainers | typosquat
**Date of research:** [YYYY-MM-DD]
**Researcher:** Claude Code via threat-landscape-check v1.1

---

## HALT ([N] dep(s))

### 🛑 some-lib@2.1.0

**Verdict reasoning:** [2-3 sentence summary of why HALT]

| Vector | Finding |
|---|---|
| Advisories (past 90d) | [details or "clean"] |
| Supply-chain (past 30d) | [details — likely the trigger] |
| Maintainers (past 6mo) | [details or "no changes"] |
| Typosquat | [details or "no collision"] |

**Installed version:** [version] | **Latest:** [version] | **Weekly downloads:** [N]

**Alternatives to consider:**
- [alternative 1, if applicable]
- [alternative 2, if applicable]

**Sources:**
- [URL 1]
- [URL 2]

**Monitoring:** Re-check in [N days] / subscribe to [feed].

[full card for each HALT]

## CAUTION ([N] dep(s))

[full card for each CAUTION — same structure as HALT but less urgent framing]

## PROCEED ([N] dep(s))

| Dep | Latest | Installed | Weekly Downloads | Notes |
|---|---|---|---|---|
| next | 15.4.1 | 15.4.1 | 4.2M | Up to date |
| @supabase/supabase-js | 2.45.3 | 2.45.3 | 380K | Up to date |
| zod | 3.22.4 | 3.22.4 | 12M | Up to date |
| [more] | | | | |

---

## Rollup

[same as Standard, plus:]

### Alternatives Discussion

[For HALT/CAUTION items, broader discussion of alternative libraries and migration considerations]

### Monitoring Suggestions

[Recommended monitoring feeds, re-check cadence, anything else proactive]

### Sources Cited

[full list of all URLs cited, organized by dep]
```

Full card per dep that needs attention. Table of PROCEED items. Extensive rollup with alternatives and monitoring.

---

## Step 3 — Deliver In PARTS If Long

For repos with 15+ deps at Thorough level, or for Standard level with 5+ HALT/CAUTION items, plan a multi-part delivery:

> "Report is long — I'll deliver in parts so it's audio-friendly. Say '2' to advance.
>
> **Part 1 of [N]: Active-attack alerts + HALT items**
>
> [content]
>
> [end of Part 1 — say '2' for CAUTION items]"

Per family doctrine norms, no part exceeds ~3000 words. Adjust split as needed.

---

## Step 4 — Offer Findings-Tracker Handoff (If HALTs Or Severe CAUTIONs)

After the report is fully delivered, if any HALT or CRITICAL-equivalent CAUTION exists:

> "[N] HALT items + [N] severe CAUTIONs detected. These are worth logging in the project's security ledger so:
> - They surface at session start, phase close, and pre-deploy (per project CLAUDE.md reflexes if configured)
> - The team has visibility beyond this one chat session
> - The audit skill (Path B) will see them as existing findings to address
>
> Want me to invoke `repo-security-findings-tracker` (Path C) now to log each as a finding? I'll walk you through them one at a time."

If yes: handoff to findings-tracker capture branch.
If no: continue.

---

## Step 5 — Generate Optional Report File

If at intake (Phase 0 Step 4) the operator opted in to saving the report:

> "Generating report file content for `agent_docs/security/threat-checks/YYYY-MM-DD-threat-check.md`.
>
> Create the file at that path with this content:
>
> [paste the full report markdown — same as what was delivered in chat]
>
> Save it. Note: the parent directory `agent_docs/security/threat-checks/` may not exist yet — create it if needed (per family doctrine Section 4.1, this is a state change, approve before mkdir):
>
> ```bash
> mkdir -p agent_docs/security/threat-checks
> ```
>
> Confirm when saved."

After save, EVIDENCE check:

```bash
ls agent_docs/security/threat-checks/
```

Confirm the file is present.

---

## Step 6 — Close-Out Summary

> "Threat-landscape check complete.
>
> **Summary:**
> - Scanned: [N] direct deps
> - Verdicts: [N] PROCEED / [N] CAUTION / [N] HALT
> - Audit-readiness: [PROCEED / PROCEED WITH NOTES / HALT]
> - Report file: [saved to agent_docs/security/threat-checks/ / not saved per your choice]
> - Findings logged via Path C: [N / none]
>
> **Recommended next action:**
> - [If PROCEED rollup] Activate Path B (`repo-security-audit`) to run the full audit
> - [If HALT rollup] Resolve HALT items first — typically pinning versions, replacing the affected dep, or waiting for the incident to clear. Re-run threat-check after.
> - [If you logged findings] Use Path D (status update) when each is resolved
>
> Returning to standby."

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Operator wants to "just fix it now" mid-report | Wrong skill | This skill doesn't fix anything. Suggest activating Path B (audit) or Path C (log finding) for fixing/tracking. |
| Active-attack alert missed by initial research, surfaces during reporting | Research gap | Stop, surface immediately, treat as HALT, offer findings-tracker handoff before continuing |
| Report file already exists at target path | Previous threat-check today | Recommend appending with timestamp, or saving as separate file (e.g., `2026-05-19-threat-check-v2.md`) |
| Operator pushes back on a verdict | Disagrees with the assessment | Family doctrine Section 4.8 — surface the override, ask for explicit confirmation, proceed with operator's call but note the override in the report |

---

## Checkpoint

Report phase complete when:

- [ ] Active-attack alerts surfaced first (if any)
- [ ] Report delivered at chosen output level
- [ ] Report delivered in PARTS if length warranted
- [ ] Findings-tracker handoff offered if HALTs or severe CAUTIONs present
- [ ] Report file generated and saved (if operator opted in)
- [ ] Close-out summary delivered
- [ ] Operator confirms close-out

---

## Skill Done. Returning To Standby.

The bundle returns to passive state — no further skill activity until the operator activates again.

🛡️
