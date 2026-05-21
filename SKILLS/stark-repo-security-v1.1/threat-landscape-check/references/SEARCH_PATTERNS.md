# SEARCH_PATTERNS — threat-landscape-check

> **Reference doc.** Web-search query templates with current-date placeholders. Pull during Phase 2 (Threat Research) when running searches per dep or per session.

The current date is available in chat context. Always substitute `<current-month>` and `<current-year>` with actual values — generic queries like "recent" deprioritize search ranking.

---

## Session-Level Searches (Run Once Per Skill Invocation)

These broad sweeps catch ecosystem-wide incidents that affect multiple deps. Run once at the start of Phase 2, before per-dep searches.

### S1 — Active Supply-Chain Sweep

```
npm supply chain attack <current-month> <current-year>
```

Example (May 2026): `npm supply chain attack May 2026`

**What it catches:** Recent npm-wide attacks. The TanStack incident, the original `event-stream` story, periodic malicious-package waves.

### S2 — Recent Malicious Package Sweep

```
npm malicious package <current-month> <current-year>
```

**What it catches:** Specific packages discovered to be malicious recently. Cross-reference results against the target dep list.

### S3 — Maintainer Compromise Sweep

```
npm package maintainer compromised <current-year>
```

**What it catches:** Account takeover incidents. May surface a few historical cases too — filter to recent.

### S4 — Registry-Level Incidents (Optional)

```
npm registry security incident <current-year>
```

**What it catches:** Issues with the npm registry itself, registry-wide rule changes, or major policy shifts that might affect threat models.

---

## Per-Dep Searches (Run For Each Dep Or Each Concerning Dep)

For each dep in the target list, run as appropriate.

### P1 — CVE Search

```
<dep-name> npm vulnerability <current-year>
```

Example: `axios npm vulnerability 2026`

**What it catches:** Recent CVE entries for this specific dep. Filter for severity.

### P2 — GitHub Security Advisory Search

```
<dep-name> GHSA <current-year>
```

Example: `next GHSA 2026`

**What it catches:** GitHub Security Advisory entries specifically. Often the highest-quality source.

### P3 — Supply-Chain Attack Search Per Dep

```
<dep-name> npm supply chain attack <current-month> <current-year>
```

Example: `@tanstack/react-query npm supply chain attack May 2026`

**What it catches:** This dep specifically being targeted. The TanStack incident would surface here.

### P4 — Compromise / Malicious Version Search

```
<dep-name> malicious version <current-year>
"<dep-name>" compromised
```

Quotes around scoped packages (e.g., `"@tanstack/react-query"`) help search engines treat the name as a single entity.

### P5 — Maintainer Change Search (When Other Vectors Are Quiet)

```
<dep-name> maintainer change <current-year>
<dep-name> ownership transfer
```

**What it catches:** Discussion of who owns the package. Useful when you want to verify the dep's stewardship is stable.

---

## Combining Patterns For Efficiency

For repos with many deps, batch searches by concern type:

### Batch A — Sweep CVEs Across Major Deps

For deps with 50k+ weekly downloads (well-known), a single search captures most of what you need:

```
<dep1> OR <dep2> OR <dep3> npm vulnerability <current-month> <current-year>
```

Use sparingly — search engines don't always treat OR queries well. Better for confirming "nothing major today" across a group.

### Batch B — Single Search Per Major Dep, Multiple Concerns

For high-priority deps (auth, payments, crypto):

```
<dep-name> npm <current-year> vulnerability OR attack OR compromise OR malicious
```

Catches anything concerning in one query. Useful for deps where you want a thorough sweep.

---

## `npm view` Commands (Read-Only Registry Queries)

These are not web searches — they're direct registry queries. Run freely; they're fast and free.

### V1 — Latest Version

```bash
npm view <dep-name> version
```

### V2 — Maintainers

```bash
npm view <dep-name> maintainers
```

### V3 — Repository URL

```bash
npm view <dep-name> repository.url
```

### V4 — Weekly Downloads

```bash
npm view <dep-name> downloads.weekly 2>/dev/null
```

Note: `downloads` field may not exist on all packages — the `2>/dev/null` suppresses the error if absent.

### V5 — Time History (When Was Each Version Published)

```bash
npm view <dep-name> time --json | head -20
```

Useful for spotting suspicious publish patterns (sudden bursts after long quiet periods).

### V6 — Deprecation Notice

```bash
npm view <dep-name> deprecated
```

If the package is deprecated, this returns the deprecation message.

### V7 — Full Metadata

```bash
npm view <dep-name>
```

Comprehensive — returns everything. Use when you want a complete picture.

---

## Batching `npm view` For All Deps

When researching the full target list, batch with a loop:

```bash
for dep in $(cat target-list.txt); do
  echo "=== $dep ==="
  echo "Latest: $(npm view "$dep" version 2>/dev/null)"
  echo "Weekly DL: $(npm view "$dep" downloads.weekly 2>/dev/null || echo 'unknown')"
  echo "Repo: $(npm view "$dep" repository.url 2>/dev/null)"
  echo "Deprecated: $(npm view "$dep" deprecated 2>/dev/null || echo 'no')"
  echo ""
done
```

Where `target-list.txt` contains one dep name per line.

This is read-only and safe. Either you run it directly (if Bash tool is available) or generate the snippet for the operator to run and paste back.

---

## Anti-Patterns In Search Queries

### Don't Use Bare "Recent"

❌ `<dep-name> recent vulnerability`

Search engines deprioritize "recent" — it's a noise word in security queries. Always use explicit date.

### Don't Use Future Dates

❌ `<dep-name> vulnerability December 2026` (if current month is May)

Search will return nothing. Use current month and year only.

### Don't Use Quotes Inside Quotes

❌ `"axios "supply chain" attack"`

Confuses search engines. Pick one phrase to quote, not nested.

### Don't Query Without Year For Time-Sensitive Topics

❌ `axios npm vulnerability`

Returns vulnerabilities from 2019 mixed with 2026. Always include the year for time-sensitivity.

### Don't Over-Use OR

❌ `dep1 OR dep2 OR dep3 OR dep4 OR dep5 OR dep6 OR dep7 npm vulnerability 2026`

Diminishing returns past 3-4 ORs. Search engines start treating it like noise.

---

## Quality Filters For Search Results

When reading results, prioritize:

1. **GitHub Security Advisories** (`github.com/advisories/`) — highest quality, structured data
2. **npm advisory pages** (`npmjs.com/advisories/`) — official
3. **Maintainer GitHub issues** acknowledging incidents — primary source
4. **Security research firms** (Snyk, Socket, Sonatype, OSS-Fuzz, Phylum) — well-researched
5. **CVE.org / NVD** — authoritative for CVEs specifically
6. **Reputable security publications** (Krebs, BleepingComputer, security-focused outlets)

De-prioritize:
- Generic tech news repeating other sources without verification
- Forum threads without citations
- AI-generated security summaries (especially if they don't cite primary sources)
- SEO-spam sites that aggregate without value-add

---

## Date Handling Note

The current date is always available in chat context. Substitute it programmatically when constructing queries — don't hardcode dates in this file. Examples in this doc use `<current-month>` and `<current-year>` as placeholders.

If the date appears stale (e.g., system clock issue), prefer the latest plausible date over a fabricated one.
