# RED_FLAGS — threat-landscape-check

> **Reference doc.** Signals that should raise concern during per-dep research. Pull during Phase 2 (Threat Research) when assessing whether findings constitute PROCEED / CAUTION / HALT.

This file lists known threat patterns and how to weight them. It's not exhaustive — the npm threat landscape evolves — but it captures the major classes of supply-chain attacks observed through 2026.

---

## Class 1: Active Supply-Chain Attacks (HALT Territory)

These are the "stop everything and verify" signals. If any of these surface, the dep gets HALT regardless of other vectors.

### 1.1 Malicious Version Published Under Legitimate Package Name

**Pattern:** A maintainer account is compromised; an attacker publishes a malicious version of a legitimate package. Users with caret/tilde version ranges auto-install the malicious version.

**Signals:**
- News reports mentioning the specific package name + "compromised" / "malicious" / "supply chain"
- npm advisory database flagging specific versions as malicious
- GitHub issue thread on the package's repo with maintainers acknowledging compromise
- Sudden flurry of new versions published in tight succession (legit packages don't typically publish 3 versions in 2 hours unless reverting)

**Examples through 2026:**
- `event-stream` (2018) — classic case
- TanStack `react-query` incident (May 2026, ahead of this skill's release)
- Multiple `@types/*` typosquats over the years

**Action:** HALT. Surface as active-attack alert at top of report. Recommend pinning to known-safe version. Recommend logging as CRITICAL finding.

### 1.2 Maintainer Account Takeover (No Bad Version Yet, But Recent Change)

**Pattern:** Maintainer account changes hands (sold, transferred, or compromised) but no malicious version has been published yet. The risk is *future* updates.

**Signals:**
- `npm view <dep> maintainers` shows unfamiliar accounts compared to historical
- Repository ownership in GitHub recently transferred
- Author email domain doesn't match the dep's "homepage" URL domain
- Discussion in the dep's GitHub issues about ownership changes

**Action:** CAUTION (escalate to HALT if multiple signals stack). Pin the current safe version explicitly. Recommend monitoring for future updates with extra care.

### 1.3 Typosquat Of Popular Package

**Pattern:** A package name is one character off from a popular package, designed to catch typos during `npm install`. The typosquat package usually has malicious code.

**Signals:**
- Package name differs from a known-popular package by 1-2 characters (`axois` vs `axios`, `crypt0js` vs `crypto-js`)
- Very low weekly downloads (under 1,000) on a name that "looks" popular
- Repository URL doesn't point to a known org
- Published recently (past 90 days)

**Action:** HALT. This shouldn't be in `package.json` unless the operator confirms it's intentional (very rare). Treat as install mistake.

---

## Class 2: Known Vulnerabilities (CAUTION Territory)

These are the standard CVE-flavored signals. They warrant attention but don't necessarily block today's work — the audit cycle handles them properly.

### 2.1 Recent CVE (Past 30 Days, Severity HIGH+)

**Pattern:** A vulnerability was published recently affecting this dep at a severity that warrants attention.

**Signals:**
- GitHub Security Advisories entry for the dep, severity HIGH or CRITICAL, published in past 30 days
- npm advisory feed flagging this dep
- News articles discussing the CVE

**Action:** CAUTION (escalate to HALT if installed version is in the affected range and no fixed version exists yet). Note in report; will be picked up by audit.

### 2.2 Older CVE Still Unpatched In Installed Version

**Pattern:** A CVE was published months ago, a fixed version exists, but `package.json` is pinned to an older affected version.

**Signals:**
- Advisory exists with a patch version available
- `npm view <dep> versions` shows the patch is published
- Installed version (from package.json) is below the patch version

**Action:** CAUTION. Will be picked up by audit; threat-check just surfaces it.

### 2.3 Multiple Moderate-Severity Advisories

**Pattern:** No single critical issue, but a pile of moderate-severity advisories suggesting the dep is poorly maintained or has fundamental issues.

**Signals:**
- 3+ advisories in past 12 months
- Moderate severity each, no single CRITICAL
- Patterns suggest the dep's architecture has security weak points

**Action:** CAUTION. Surface; consider as a "dep migration candidate" note in the report.

---

## Class 3: Trust Erosion Signals (CAUTION Territory)

These signals don't constitute an attack but undermine confidence. Worth surfacing.

### 3.1 Recently Published With Low Downloads + No Repository

**Pattern:** A dep is brand new (past 30 days), has very few weekly downloads (<100), and the npm metadata's `repository` field is empty or points to a non-existent GitHub repo.

**Signals:**
- `npm view <dep> time.created` is within past 30 days
- `npm view <dep> downloads.weekly` shows <100
- `npm view <dep> repository.url` empty, or 404 on GitHub

**Action:** CAUTION. The operator should verify this dep is what they think it is — could be a typosquat or never-quite-launched experiment.

### 3.2 Repository Activity Doesn't Match Package Activity

**Pattern:** The npm package shows recent versions published, but the GitHub repository has been dormant for months.

**Signals:**
- npm shows new versions in past 90 days
- GitHub repo shows no commits in past 6 months
- Last GitHub commit doesn't match the latest npm version's published date

**Action:** CAUTION. Could be legitimate (dist-only updates) but more often signals a compromised publish pipeline.

### 3.3 Author/Maintainer Identity Issues

**Pattern:** The dep's stated author or maintainer info has indicators of evasion or fakeness.

**Signals:**
- Author email at a free domain (gmail, hotmail) for a package claiming enterprise use
- Maintainer GitHub profile created in past 30 days with one repo
- "Verified" badge inconsistencies
- Multiple maintainers from different unrelated identities (could be normal for big projects, suspicious for small ones)

**Action:** CAUTION if multiple signals; note in report regardless.

---

## Class 4: Information Hygiene Signals (PROCEED With Note)

These don't warrant CAUTION, but they're worth noting at Thorough output level for awareness.

### 4.1 Deprecated Package Still In Use

`npm view <dep>` shows a deprecation notice. Not a security issue, but signals migration is needed eventually.

### 4.2 Package At Major Version Behind

`npm view <dep>` shows latest is 5.x, installed is 3.x. Not a security issue per se, but suggests upgrade work is owed.

### 4.3 Very High Download Volume + Recent Major Release

Major releases of widely-used packages often have a few rough days. Worth noting at Thorough level so the operator knows new issues might surface.

---

## How To Weight Signals

The verdict logic (formalized in `decision-trees/proceed-caution-halt.md`):

| Signal Class | Single Hit | Multiple Hits |
|---|---|---|
| Class 1 (active attack) | HALT | HALT (with urgent visibility) |
| Class 2 (CVE) | CAUTION (HALT if installed in affected range with no patch) | CAUTION → HALT if 3+ |
| Class 3 (trust erosion) | CAUTION | CAUTION → HALT if 3+ across different signals |
| Class 4 (hygiene) | PROCEED with note | PROCEED with note |

**Defaulting rule:** When in doubt between two verdict levels, escalate to the more conservative one. The cost of a false-positive HALT is 30 seconds of operator review. The cost of a false-negative PROCEED is potentially an incident.

---

## What Gets Cited

For any CAUTION or HALT verdict, cite at least one source URL. Acceptable sources:

- GitHub Security Advisories (`github.com/advisories/GHSA-*`)
- npm advisory pages
- Maintainer-confirmed compromise announcements (GitHub issues, blog posts)
- Reputable security research (Snyk, Sonatype, Socket, OSS-Fuzz)
- News articles from reputable security publications (NOT generic tech news that summarizes without verification)

Speculative blog posts, forum threads without citations, or AI-generated security summaries are NOT citable sources for HALT verdicts.

---

## When New Threat Classes Emerge

As npm threat patterns evolve, append new classes to this file (with date of first observed). Bump the threat-landscape-check skill version when adding. Don't quietly mutate — track what changed and when.
