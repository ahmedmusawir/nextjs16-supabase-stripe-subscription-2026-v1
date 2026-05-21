# Decision Tree: PROCEED / CAUTION / HALT

> Use this in Phase 2 (Threat Research) when assigning a verdict to a dep, especially when multiple signals conflict or are ambiguous. Reference `RED_FLAGS.md` for the signal-class definitions.

## The Default Verdict

**PROCEED is the default.** Most deps, most of the time, are fine. The verdict process is asking "is there a reason NOT to proceed?" Not "is there a reason to proceed?"

If research surfaces no concerning signals across all four vectors (advisories, supply-chain, maintainers, typosquat), the verdict is PROCEED. No further analysis needed.

## When Signals Are Mixed — The Defaulting Rule

**Escalate to the more conservative verdict.** A signal that *could* be CAUTION OR HALT should be HALT. A signal that *could* be PROCEED OR CAUTION should be CAUTION.

Reasoning: false-positive cost is low (operator reviews and decides). False-negative cost is high (operator proceeds into an incident).

This rule is decisive. Don't over-think.

## Decision Questions

### Q1: Is there ANY active supply-chain attack mentioning this dep?

Check Vector 2 (supply-chain) and the session-level supply-chain sweep results.

| Answer | Verdict |
|---|---|
| Yes — confirmed by reputable source (GHSA, maintainer GH issue, security firm) | **HALT** |
| Yes — but only mentioned in a forum thread without citations | CAUTION (research further before HALT) |
| No | Continue to Q2 |

### Q2: Is there a CVE published in the past 30 days at HIGH or CRITICAL severity?

Check Vector 1 (advisories).

| Answer | Verdict |
|---|---|
| Yes — and installed version is in the affected range, no patch available | **HALT** |
| Yes — and installed version is in the affected range, patch available | **CAUTION** (audit can resolve) |
| Yes — but installed version is NOT in the affected range | PROCEED with note |
| No | Continue to Q3 |

### Q3: Is there a CVE published in past 90 days at MODERATE+ severity?

| Answer | Verdict |
|---|---|
| Yes — installed version affected | **CAUTION** |
| Yes — installed version not affected | PROCEED with note |
| No | Continue to Q4 |

### Q4: Maintainer changes in past 6 months?

Check Vector 3 (maintainers). Look for changes in `npm view <dep> maintainers` compared to historical patterns.

| Answer | Verdict |
|---|---|
| Yes — and the change has no obvious legitimate explanation (no announcement, no acquisition news, no GitHub org transfer documentation) | **CAUTION** |
| Yes — but legitimate (documented acquisition, GH org transfer with announcement, etc.) | PROCEED with note |
| No | Continue to Q5 |

### Q5: Typosquat collision with a popular package?

Check Vector 4 (typosquat).

| Answer | Verdict |
|---|---|
| Yes — name is 1 character off from a major popular package AND this dep has very low downloads + no repo | **HALT** (likely install mistake) |
| Yes — name similarity exists but downloads + repo + history look legit | PROCEED with note (operator should verify intent) |
| No | Continue to Q6 |

### Q6: Multiple trust-erosion signals stacking?

Check Class 3 signals from RED_FLAGS.md (low downloads + recent publish, repo activity mismatch, identity issues).

| Count | Verdict |
|---|---|
| 0-1 signals | PROCEED with note (if 1) |
| 2 signals | **CAUTION** |
| 3+ signals | **HALT** (the combination suggests something off — verify before proceeding) |

### Q7: Hygiene signals only (Class 4)?

Deprecated package, major version behind, etc.

| Answer | Verdict |
|---|---|
| Yes — but no Q1-Q6 hits | **PROCEED with note** |
| No | **PROCEED** |

---

## Common Patterns

### Pattern A: Clean Sweep

`next@15.4.1` — actively maintained framework, recent versions clean, well-known maintainer org, no recent CVEs, no supply-chain mentions, name unambiguous.

Q1: No. Q2: No. Q3: No. Q4: No. Q5: No. Q6: 0. Q7: No.

**Verdict: PROCEED**

### Pattern B: Active Attack (TanStack-Like Scenario)

`@tanstack/react-query@5.x` — recent supply-chain incident in past 7 days affecting versions 5.65.0-5.65.2. Installed version is 5.62.0.

Q1: YES — confirmed by maintainer GH issue.

**Verdict: HALT** (with active-attack alert at top of report; installed version isn't in affected range but adjacency warrants verification before proceeding).

### Pattern C: Known Vuln With Patch

`axios@1.6.2` — moderate CVE published 2 months ago, patched in `axios@1.6.7`.

Q1: No. Q2: No (not past 30d). Q3: YES — moderate, past 90d, installed affected, patch available.

**Verdict: CAUTION** — note that the audit will resolve this via standard upgrade.

### Pattern D: Maintainer Change Without Documentation

`some-utility@2.1.0` — `npm view` shows two new maintainers added in past 3 months, no announcement, no GH activity matching the changes.

Q1: No. Q2: No. Q3: No. Q4: YES — undocumented maintainer change.

**Verdict: CAUTION** — note recommendation to pin current version explicitly and monitor for next update.

### Pattern E: Typosquat

`requestt@1.0.0` (hypothetical) — name is `request` with extra `t`. 47 weekly downloads. No GitHub repo. Published 21 days ago. Author is "anon-x9".

Q1: No (no specific attack reported yet). Q2: No. Q3: No. Q4: No (no maintainers, no history). Q5: YES — clear typosquat of `request`. Q6: 3+ trust-erosion signals (very low downloads, recent publish, no repo).

**Verdict: HALT** — almost certainly an install mistake. Likely should be `request` (which itself is deprecated, but at least it's the real thing). Verify operator intent.

### Pattern F: Stacked Cautions Escalating

`some-package@3.1.0` — moderate CVE 60 days ago, maintainer added 4 months ago (no announcement), package downloads dropped 50% in past 6 months (suggests user trust eroding).

Q3: CAUTION. Q4: CAUTION. Q6: 1 trust-erosion signal.

Two CAUTIONs stacking with hygiene concerns. Per the defaulting rule:

**Verdict: CAUTION → consider HALT if a third signal surfaces.** Operator's call ultimately.

---

## When Operator Disagrees With The Verdict

Per family doctrine Section 4.8 (Operator Override Protocol), the operator's authority is supreme. If the tree says HALT but operator wants to proceed:

1. **Acknowledge** the override
2. **Name** the specific signals driving the HALT verdict
3. **State** what could go wrong if the signals are right
4. **Ask** for explicit confirmation

Example:

> Operator: "Mark axios as PROCEED, I know about that CVE, we'll handle it in the audit."
>
> Response: "Acknowledged — overriding the CAUTION verdict on axios@1.6.2. The signals driving CAUTION: moderate CVE (CVE-2026-XXXXX) published [date], installed version 1.6.2 is in affected range, patch in 1.6.7. The failure mode if left unaddressed: the SSRF vector described in the advisory could be exploited if an attacker influences the URL passed to axios calls. You've stated this will be handled in the audit. Confirm explicitly to override the CAUTION → PROCEED for this report."

After confirmation: log the verdict as the operator chose, but note in the report that this was an operator override.

---

## The Most Important Rule

**False-positive HALTs are cheap. False-negative PROCEEDs are expensive.**

When in doubt, escalate. The operator can downgrade a CAUTION or HALT in 30 seconds of review. An incident from a missed HALT can cost days or weeks.

Conservative defaulting is not paranoia — it's risk-cost asymmetry done right.
