# Workflow 02 — Threat Research

> For each dep in the locked target list, run the four research vectors. Web research + read-only `npm view` queries. No state changes. Reference `references/SEARCH_PATTERNS.md` for query templates and `references/RED_FLAGS.md` for signal weighting.

---

## The Four Research Vectors

For each dep, gather information across these four vectors. Reference `references/SEARCH_PATTERNS.md` for the exact query templates with current-date placeholders.

### Vector 1: Recent CVE Advisories (Past 90 Days)

What it catches: vulnerabilities published to GitHub Security Advisories, npm advisory feed, or other CVE sources within the past quarter.

Web search pattern (substitute current month/year):
```
<dep-name> npm vulnerability <current-year>
<dep-name> CVE <current-year>
<dep-name> GHSA advisory <current-year>
```

Also check programmatically:
```bash
npm view <dep-name> | head -30
```

This shows the latest published version and metadata. Compare to what's currently installed.

### Vector 2: Supply-Chain Attacks (Past 30 Days)

What it catches: active malicious package incidents — someone published malware under the package name, the registry account was compromised, a typo-similar package targets users of this dep.

Web search pattern:
```
<dep-name> npm supply chain attack <current-month> <current-year>
<dep-name> malicious package <current-year>
npm hijack <dep-name>
```

Also check the broader npm threat landscape:
```
npm supply chain attack <current-month> <current-year>
npm malicious package <current-month> <current-year>
```

Run the broader search ONCE per session (not per dep) — it surfaces the news that affects multiple deps simultaneously. Cross-reference against the target list.

### Vector 3: Maintainer Ownership Changes (Past 6 Months)

What it catches: the increasingly common attack vector where a legitimate package's maintainer account gets compromised or sold, leading to a malicious update.

Read-only registry query:
```bash
npm view <dep-name> maintainers
npm view <dep-name> author
npm view <dep-name> time --json | head -30
```

The `time` output shows when each version was published. Look for patterns:
- Long-stable package with sudden burst of new versions (suspicious)
- Maintainer list with unfamiliar names that don't match the GitHub org (suspicious)
- Repository URL doesn't match the actual GitHub repo (suspicious)

Web search if anything looks off:
```
<dep-name> maintainer change <current-year>
<dep-name> ownership transfer
```

### Vector 4: Typosquat / Name-Collision Similarity

What it catches: this dep being a typosquat of a more popular package, OR a popular typosquat exists nearby that the operator might confuse with this one.

Check:
```bash
# Confirm the package exists and verify repo URL matches
npm view <dep-name> repository.url
npm view <dep-name> homepage
npm view <dep-name> downloads.weekly  # rough proxy for legitimacy
```

Red flags:
- Package with 1-character difference from a major popular package (e.g., `axois` vs `axios`)
- Very low weekly downloads (<100) on a package that "should" be popular
- Recently published (past 30 days) with no GitHub stars
- Repository URL points to a GitHub repo that doesn't exist or has zero activity

---

## Step 1 — Run The Broader Supply-Chain Sweep First

Before per-dep research, run the wide-net supply-chain search once:

Web search:
```
npm supply chain attack <current-month> <current-year>
npm malicious package <current-month> <current-year>
```

Read the results. Cross-reference any package names mentioned against the target list. Any matches → automatic HALT candidate for those deps; flag them at the top of Phase 3's report.

This single search is high-leverage — it surfaces incidents that affect the broader npm ecosystem, not just one dep.

---

## Step 2 — Per-Dep Research

For each dep in the locked target list, gather data across Vectors 1-4. Batch where efficient:

**Efficiency tips:**
- Vectors 1 and 2 can sometimes be combined in one search: `<dep-name> npm vulnerability OR attack <current-year>`
- Vector 4 (`npm view`) is fast — batch these locally with a loop:

```bash
for dep in <dep-list>; do
  echo "=== $dep ==="
  npm view "$dep" maintainers
  npm view "$dep" repository.url
  npm view "$dep" downloads.weekly 2>/dev/null
  npm view "$dep" time.modified
  echo ""
done
```

(The operator runs this and pastes back; or you can run it yourself if Bash tool is available.)

**Don't over-research well-known stable deps.** For `react`, `next`, `typescript`, `eslint`, `webpack`, `tailwindcss`, `lodash` — these are well-known to the operator, and unless the broader supply-chain sweep flagged them, a single search is enough to confirm "nothing concerning in past 30 days."

**Do deep-dive on unfamiliar deps.** Especially deps with:
- Names you don't recognize
- Versions that look fresh (last published within 30 days)
- Low download counts (<10,000/week)
- Maintainers you can't immediately verify

---

## Step 3 — Per-Dep Verdict Assignment

After research, assign a verdict per dep using `decision-trees/proceed-caution-halt.md` logic:

| Signal | Contributes To |
|---|---|
| Active supply-chain attack mentioning this dep | HALT |
| CVE published in past 30 days, severity HIGH+ | HALT |
| CVE published in past 90 days, severity MODERATE+ | CAUTION |
| Maintainer change in past 6 months + no obvious legit reason | CAUTION |
| Typosquat collision detected | CAUTION (or HALT if very similar to popular target) |
| Low downloads + recent publish + no GitHub repo | CAUTION |
| None of the above | PROCEED |

If multiple CAUTION signals stack up, escalate to HALT. Conservative defaulting wins — operator can downgrade a CAUTION later, but a missed HALT costs an incident.

Capture for each dep:
- Verdict (PROCEED / CAUTION / HALT)
- Reasoning (1-line summary)
- Primary source citation (URL) if CAUTION or HALT
- Recommended action (for Standard/Thorough output levels)

---

## Step 4 — Aggregate For Repo Rollup

After all deps are verdicted, compute the rollup:

```
PROCEED count: N
CAUTION count: N
HALT count: N

Audit-readiness:
- 0 HALT, 0 CAUTION → PROCEED (audit can run without concern)
- 0 HALT, 1+ CAUTION → PROCEED WITH NOTES (audit can run; document CAUTIONs during audit)
- 1+ HALT → HALT (do not audit until HALT items resolved or verified safe)

Active-attack alert: yes/no (if any dep matched an active supply-chain incident)
```

---

## Step 5 — Audio-First Output Discipline

For repos with 15+ deps at "Thorough" output level, the report can be long. Plan to break the Phase 3 delivery into PARTS:

- Part 1: Active-attack alerts + HALT items (most urgent)
- Part 2: CAUTION items with details
- Part 3: PROCEED items (summary table or bullet list)
- Part 4: Rollup and recommended next steps

The operator says "2", "3", "4" to advance. Or at Tight level, everything fits in one part naturally.

---

## Step 6 — Hand To Phase 3

After all research is captured and verdicted:

> "Research complete. [N] deps assessed against four vectors. Moving to `workflow/03-report.md` for the report generation at your chosen [Tight / Standard / Thorough] output level."

Move to Phase 3.

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Web search returns nothing for a dep | Dep name unique enough that no news = good news | Treat as PROCEED unless other vectors raise concern |
| `npm view <dep>` fails with 404 | Dep doesn't exist on npm registry | Major red flag — confirm with operator, this could be a typo or unpublished package. HALT until clarified. |
| Search results for "<dep> attack" return false positives | Common package name shares words with other topics | Read carefully, filter; specific date-bounded searches help |
| Broader supply-chain sweep returns 10+ incidents | Active broad-spectrum attack on npm | Cross-reference each carefully; this is exactly the situation this skill exists to catch |
| `npm view` rate-limited | Too many sequential calls | Wait 30 seconds, retry; or batch with single search per dep instead |
| Operator says "skip the rest, just give me what we've got" | Time pressure mid-research | Honor the request, but flag explicitly in the report: "Partial research only — N deps unresearched at operator request." |

---

## Checkpoint

Research complete when:

- [ ] Broader supply-chain sweep run once for the session
- [ ] Each dep researched against all four vectors (or explicitly partial with operator approval)
- [ ] Verdict assigned per dep (PROCEED / CAUTION / HALT) with reasoning + source
- [ ] Repo rollup computed
- [ ] Active-attack alerts identified if any
- [ ] Ready to generate the report at the chosen output level

Next file: `workflow/03-report.md`
