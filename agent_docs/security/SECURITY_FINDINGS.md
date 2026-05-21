# Security Findings — nextjs16-supabase-stripe-subscription-2026-v1

> **Purpose:** Track real security issues affecting this project. Per the strict `stark-repo-security-v1.1` template, this file is intended for own-code issues (PII leaks, missing input validation, error-message leaks, auth gaps, fraud vectors). Dep-vulnerability findings are normally resolved by the audit skill (`repo-security-audit`) rather than logged here — but operator's explicit decision (2026-05-21) is to log the 3 May 2026 framework-level CAUTIONs here for deploy-time visibility. Each such entry is clearly labeled `[dep-vulnerability]` and notes the fix-path is the audit skill, not code change.
>
> **How entries get added:** Use `stark-repo-security/repo-security-findings-tracker/` skill. The skill walks the capture conversationally.
>
> **How entries get read:** Per the project root `CLAUDE.md` reading reflexes (if configured) — at session start, at phase close, at pre-deploy, and during code review.

---

## Status Legend

- 🔴 **OPEN** — Confirmed, no fix yet
- 🟡 **IN PROGRESS** — Fix planned or in flight
- ✅ **FIXED** — Addressed and verified
- ⚪ **DEFERRED** — Acknowledged, intentionally not yet addressed
- ⚫ **WON'T FIX** — Documented decision not to address (rationale below)

## Severity Legend

- 🔴 **CRITICAL** — Production data exposure, RCE, auth bypass, payment fraud vector
- 🟠 **HIGH** — PII / financial data leak, missing input validation on money/PHI paths
- 🟡 **MEDIUM** — Hardening opportunity, missing defense-in-depth, fraud-enabling without active leak
- 🟢 **LOW** — Code smell with security implication, best-practice deviation

---

## Findings

<!-- Findings appended below in order of discovery. Sequential numbering, never renumber. -->

## Finding #1 — Next.js 16.2.1 affected by 11 CVEs disclosed May 6, 2026 [dep-vulnerability]

**Status:** 🔴 OPEN
**Severity:** 🟠 HIGH (framework-level dep; includes SSRF, middleware bypass, XSS, RSC DoS, cache poisoning vectors)

### Problem

The `next` package version locked at `16.2.1` (lockfile-pinned; range `^16.2.1` in `package.json`) is affected by 11 CVEs that were publicly disclosed on **May 6, 2026** by the Vercel team. The vulnerabilities span multiple classes:

- **CVE-2026-44578 (GHSA-c4j6-fc7j-m34r)** — Server-side request forgery via crafted WebSocket upgrade requests on self-hosted Node deployments.
- **GHSA-267c-6grr-h53f / GHSA-26hh-7cqf-hhc6 / GHSA-492v-c6pp-mqqv** — Middleware bypass via specially crafted `.rsc` and segment-prefetch URLs resolving to the same page without being matched by middleware rules.
- **CVE-2026-23870 (GHSA-rv78-f8rc-xrxh — also affects react/react-dom; see Findings #2 and #3)** — DoS in App Router Server Function endpoints.
- **GHSA-ffhc-5mcf-pf4q / GHSA-gx5p-jg67-6x7h** — XSS in App Router CSP-nonce flow and in `beforeInteractive` scripts with untrusted input.
- **GHSA-h64f-5h5j-jqjh** — DoS in the Image Optimization API.
- **GHSA-wfc6-r584-vfw7 / GHSA-vfv6-92ff-j949** — Cache poisoning of React Server Component responses.
- **GHSA-mg66-mrh9-m8jx** — Connection-exhaustion DoS in Cache Components.
- **GHSA-3g8h-86w9-wvmq** — Cache poisoning of middleware redirects.

Exploitation potential ranges from DoS (resource exhaustion) to authentication-context bypass (middleware) to script execution (XSS) to data exfiltration (SSRF). The middleware-bypass and SSRF CVEs in particular could expose the Supabase service-role and Stripe API surfaces of this app if reachable from an unauthenticated path.

The patched version `next@16.2.6` was published 2026-05-21 (today) and is **within the existing `^16.2.1` caret range** — meaning a fresh `npm install` from the current `package.json` will pick it up.

### Discovery

Surfaced during the 2026-05-21 threat-landscape-check (Path A) — broader npm supply-chain sweep + per-dep Vector 1 search returned the May 6 Vercel security advisory cluster. EVIDENCE: `npm view next version` confirmed `16.2.6` is the current latest; lockfile pins `16.2.1`.

### Recommended Fix

**Fix-path = `repo-security-audit` (Path B), not code change.** Resolution options (audit skill will pick the right one):

1. **`rm -rf node_modules package-lock.json && npm install`** — fully rebuilds lockfile with latest in-range versions. Cleanest. (Verify lockfile rebuild is intentional — has side effects on every other dep.)
2. **`npm update next`** — surgical bump within the caret range. Targeted; leaves other pins alone.
3. **`npm install next@16.2.6 --save`** — explicit pin to the patched version.

After the bump: run `npm audit` (should report 0 vulnerabilities for `next`), `npm run build` (must succeed — no Next.js API breakage), and the full test suite (118/118 unit/integration + 18/18 E2E should remain green).

### Mitigation Until Fix

- `node_modules` is currently NOT installed on this machine — meaning no runtime exposure from local dev today.
- Production deploy (if any) is gated by the operator; recommend NOT deploying with the current lockfile until the bump lands.

### Files

- `package.json` (entry: `"next": "^16.2.1"`)
- `package-lock.json` (locked: `next@16.2.1`)

### References

- [Vercel/next.js security advisories index](https://github.com/vercel/next.js/security/advisories)
- [Netlify changelog — React/Next.js security vulnerabilities](https://www.netlify.com/changelog/2026-05-08-react-nextjs-security-vulnerabilities/)
- [Cloudflare WAF/adapter mitigations](https://developers.cloudflare.com/changelog/post/2026-05-06-react-nextjs-vulnerabilities/)
- Threat-check report: `agent_docs/security/threat-checks/2026-05-21-threat-check.md`

---

## Finding #2 — React 19.2.4 affected by RSC DoS CVE-2026-23870 [dep-vulnerability]

**Status:** 🔴 OPEN
**Severity:** 🟡 MEDIUM (denial of service only; no data exfiltration; framework-level but mitigated by within-range patch availability)

### Problem

The `react` package version locked at `19.2.4` (lockfile-pinned; range `^19.2.4` in `package.json`) is affected by **CVE-2026-23870** (GHSA-rv78-f8rc-xrxh), a high-severity denial-of-service vulnerability disclosed on **May 6, 2026** affecting React Server Components.

Per the advisory: "A specially crafted HTTP request sent to any App Router Server Function endpoint, when deserialized, can trigger excessive CPU usage." Affected versions span 19.0.0-19.0.5, 19.1.0-19.1.6, and 19.2.0-19.2.5. **Our pinned 19.2.4 is in the affected range.**

Because this app uses Next.js App Router with Server Functions (Stripe checkout, Supabase auth gating, etc.), it is exposed to the vector unless behind an effective WAF/rate-limit layer.

The patched version `react@19.2.6` is **within the existing `^19.2.4` caret range**.

### Discovery

Surfaced during the 2026-05-21 threat-landscape-check (Path A) — per-dep Vector 1 search returned the Facebook React advisory. EVIDENCE: `npm view react version` confirmed `19.2.6` is the current latest; lockfile pins `19.2.4`.

### Recommended Fix

**Fix-path = `repo-security-audit` (Path B), not code change.** Same resolution as Finding #1 — `npm install` / `npm update react` will pick up the patched version. Coordinate with Finding #3 (react-dom shares the CVE) — bump both together so the React + React-DOM pair stays in lockstep.

### Mitigation Until Fix

- `node_modules` is currently NOT installed; no runtime exposure from local dev today.
- Cloudflare or similar edge-layer rate-limiting (if configured) reduces practical exploitability.

### Files

- `package.json` (entry: `"react": "^19.2.4"`)
- `package-lock.json` (locked: `react@19.2.4`)

### References

- [Facebook React advisory GHSA-rv78-f8rc-xrxh](https://github.com/facebook/react/security/advisories/GHSA-rv78-f8rc-xrxh)
- [CVE-2026-23870 (GitLab mirror)](https://advisories.gitlab.com/npm/react-server-dom-parcel/CVE-2026-23870/)
- Threat-check report: `agent_docs/security/threat-checks/2026-05-21-threat-check.md`

---

## Finding #3 — React-DOM 19.2.4 affected by RSC DoS CVE-2026-23870 [dep-vulnerability]

**Status:** 🔴 OPEN
**Severity:** 🟡 MEDIUM (same CVE as Finding #2; tracked separately because the package is independently installed)

### Problem

The `react-dom` package version locked at `19.2.4` is affected by the same **CVE-2026-23870** described in Finding #2. Affected react-server-dom-* versions: 19.0.0-19.0.5, 19.1.0-19.1.6, 19.2.0-19.2.5.

`react-dom@19.2.4` is in the affected range. The patched version `19.2.6` is within the existing `^19.2.4` caret range.

### Discovery

Surfaced during the 2026-05-21 threat-landscape-check (Path A) — per-dep Vector 1 search. EVIDENCE: `npm view react-dom version` confirmed `19.2.6` is the current latest; lockfile pins `19.2.4`.

### Recommended Fix

**Fix-path = `repo-security-audit` (Path B), not code change.** Bump in lockstep with Finding #2 (react/react-dom should always upgrade together). `npm update react react-dom` is the surgical move.

### Mitigation Until Fix

- `node_modules` is currently NOT installed; no runtime exposure from local dev today.

### Files

- `package.json` (entry: `"react-dom": "^19.2.4"`)
- `package-lock.json` (locked: `react-dom@19.2.4`)

### References

- [Facebook React advisory GHSA-rv78-f8rc-xrxh](https://github.com/facebook/react/security/advisories/GHSA-rv78-f8rc-xrxh)
- [CVE-2026-23870 (GitLab mirror)](https://advisories.gitlab.com/npm/react-server-dom-parcel/CVE-2026-23870/)
- Threat-check report: `agent_docs/security/threat-checks/2026-05-21-threat-check.md`

---
