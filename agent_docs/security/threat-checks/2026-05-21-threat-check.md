# 📊 Threat-Landscape Check — `nextjs16-supabase-stripe-subscription-2026-v1` — 2026-05-21

**Skill:** `stark-repo-security-v1.1 / threat-landscape-check`
**Operator:** Tony Stark
**Scope:** 46 direct deps (30 `dependencies` + 16 `devDependencies`)
**Output level:** Tight
**Research vectors:** advisories | supply-chain | maintainers | typosquat

---

## Active-Attack Alerts

**None.** None of our 46 direct deps appear in the May 2026 npm attack incident lists (TanStack, node-ipc, AntV / Mini Shai-Hulud, Axios).

---

## CAUTION (3 deps)

⚠️ **`next@16.2.1`** — CAUTION (11 CVEs disclosed May 6, 2026 — RSC DoS, SSRF, middleware bypass, XSS, cache poisoning; fix in **16.2.6** within `^16.2.1` range; latest published 2026-05-21)
⚠️ **`react@19.2.4`** — CAUTION (CVE-2026-23870 DoS in React Server Components; fix in **19.2.6** within `^19.2.4` range)
⚠️ **`react-dom@19.2.4`** — CAUTION (CVE-2026-23870 DoS in RSC; fix in **19.2.6** within `^19.2.4` range)

## PROCEED (43 deps)

```
✅ @heroicons/react@2.2.0 — PROCEED
✅ @hookform/resolvers@3.9.0 — PROCEED (major-behind 5.2.2 — info-hygiene only)
✅ @radix-ui/react-avatar@1.1.11 — PROCEED
✅ @radix-ui/react-dialog@1.1.15 — PROCEED
✅ @radix-ui/react-dropdown-menu@2.1.16 — PROCEED
✅ @radix-ui/react-label@2.1.8 — PROCEED
✅ @radix-ui/react-select@2.2.6 — PROCEED
✅ @radix-ui/react-slot@1.2.4 — PROCEED
✅ @radix-ui/react-tabs@1.1.13 — PROCEED
✅ @radix-ui/react-toast@1.2.15 — PROCEED
✅ @shrutibalasa/tailwind-grid-auto-fit@1.1.0 — PROCEED w/ note (last published 2022, abandoned-looking)
✅ @supabase/ssr@0.6.1 — PROCEED
✅ @supabase/supabase-js@2.44.4 — PROCEED (latest 2.106.1; major-behind info-hygiene)
✅ @tailwindcss/aspect-ratio@0.4.2 — PROCEED
✅ @tailwindcss/typography@0.5.19 — PROCEED
✅ class-variance-authority@0.7.0 — PROCEED
✅ clsx@2.1.1 — PROCEED
✅ cmdk@1.1.1 — PROCEED
✅ lucide-react@1.16.0 — PROCEED
✅ next-themes@0.4.6 — PROCEED
✅ react-hook-form@7.52.1 — PROCEED
✅ sass@1.99.0 — PROCEED
✅ stripe@22.1.0 — PROCEED
✅ tailwind-merge@3.6.0 — PROCEED
✅ tailwindcss-animate@1.0.7 — PROCEED w/ note (last published 2023, single maintainer, no repo URL)
✅ zod@3.23.8 — PROCEED (older DoS GHSA-mvrp-3cvx-c325 fixed at 3.22.3 — we're past; major-behind 4.4.3)
✅ zustand@4.5.4 — PROCEED
✅ @playwright/test@1.59.1 — PROCEED
✅ @testing-library/jest-dom@6.9.1 — PROCEED
✅ @testing-library/react@16.3.2 — PROCEED
✅ @testing-library/user-event@14.6.1 — PROCEED
✅ @types/jest@30.0.0 — PROCEED
✅ @types/node@25.9.1 — PROCEED
✅ @types/react@19.2.15 — PROCEED
✅ @types/react-dom@19.2.3 — PROCEED
✅ autoprefixer@10.5.0 — PROCEED
✅ dotenv@17.4.2 — PROCEED
✅ jest@30.4.2 — PROCEED
✅ jest-environment-jsdom@30.4.1 — PROCEED
✅ postcss@8.4.39 — PROCEED
✅ tailwindcss@3.4.6 — PROCEED (major-behind 4.3.0 — info-hygiene)
✅ ts-jest@29.4.10 — PROCEED
✅ typescript@5.5.4 — PROCEED
```

---

## Rollup

- **Counts:** 43 PROCEED / 3 CAUTION / 0 HALT
- **Audit-readiness:** **PROCEED WITH NOTES** — all 3 CAUTIONs have in-range patches; the audit skill (Path B) will resolve them via standard `npm install` / `npm update`
- **Active-attack alerts:** None — your direct deps are clear
- **Ecosystem note:** May 2026 has been brutal for npm — TanStack (May 11, 84 versions), node-ipc (May 14), Mini Shai-Hulud (May 19, 633 versions), AntV maintainer compromise (May 19, 314 packages). Recommend re-checking after audit since the campaign is still active.

---

## Methodology

Per `stark-repo-security-v1.1 / threat-landscape-check / SKILL.md` (Anthropic v2 SKILL.md format). Four research vectors applied per dep:

1. **Recent CVE advisories** (past 90 days) — WebSearch with date-bounded queries + maintainer GHSA pages
2. **Supply-chain attacks** (past 30 days) — broader npm-wide sweep + per-dep cross-reference
3. **Maintainer ownership changes** (past 6 months) — `npm view <pkg> maintainers --json`
4. **Typosquat / name-collision similarity** — `npm view <pkg> repository.url`, downloads, modified-date check

All `npm view` queries were read-only (registry queries — no install). No state changes to `package.json`, `package-lock.json`, `node_modules`, source code, or git working tree.

---

## Sources

### CAUTION items — Next.js (May 6, 2026 disclosure)

- [Netlify changelog — React/Next.js security vulnerabilities](https://www.netlify.com/changelog/2026-05-08-react-nextjs-security-vulnerabilities/)
- [Vercel/next.js security advisories index](https://github.com/vercel/next.js/security/advisories)
- [GHSA-c4j6-fc7j-m34r — Next.js SSRF via WebSocket upgrades](https://github.com/advisories/GHSA-c4j6-fc7j-m34r)
- [GHSA-q4gf-8mx6-v5v3 — Next.js DoS with Server Components](https://github.com/vercel/next.js/security/advisories/GHSA-q4gf-8mx6-v5v3)
- [GHSA-8h8q-6873-q5fj — Next.js DoS with Server Components (advisory mirror)](https://advisories.gitlab.com/npm/next/GHSA-8h8q-6873-q5fj/)
- [CVE-2026-44578 — Next.js SSRF](https://advisories.gitlab.com/npm/next/CVE-2026-44578/)
- [Cloudflare WAF/adapter mitigations for React + Next.js](https://developers.cloudflare.com/changelog/post/2026-05-06-react-nextjs-vulnerabilities/)
- [Cryptika summary of multiple critical vulns](https://www.cryptika.com/multiple-critical-vulnerabilities-patched-in-next-js-and-react-server-components/)

### CAUTION items — React Server Components (May 6, 2026 disclosure)

- [Facebook React advisory GHSA-rv78-f8rc-xrxh — RSC DoS](https://github.com/facebook/react/security/advisories/GHSA-rv78-f8rc-xrxh)
- [CVE-2026-23870 — React Server Components DoS (GitLab mirror)](https://advisories.gitlab.com/npm/react-server-dom-parcel/CVE-2026-23870/)

### Broader May 2026 npm threat landscape

- [Snyk — Mini Shai-Hulud / AntV compromise](https://snyk.io/blog/mini-shai-hulud-antv-npm-supply-chain-attack/)
- [The Register — 314 npm packages infected via account compromise](https://www.theregister.com/cyber-crime/2026/05/19/shai-hulud-keeps-burrowing-314-npm-packages-infected-after-another-account-compromise/5242601)
- [600+ npm Packages Compromised (cybersecuritynews.com)](https://cybersecuritynews.com/600-npm-packages-compromised/)
- [Microsoft Security Blog — Shai-Hulud 2.0 guidance](https://www.microsoft.com/en-us/security/blog/2025/12/09/shai-hulud-2-0-guidance-for-detecting-investigating-and-defending-against-the-supply-chain-attack/)
- [TanStack postmortem](https://tanstack.com/blog/npm-supply-chain-compromise-postmortem)
- [StepSecurity — node-ipc malicious versions](https://www.stepsecurity.io/blog/node-ipc-npm-supply-chain-attack)
- [Trend Micro — Axios npm package compromised](https://www.trendmicro.com/en_us/research/26/c/axios-npm-package-compromised.html)
- [Wiz — Mini Shai-Hulud SAP npm packages](https://www.wiz.io/blog/mini-shai-hulud-supply-chain-sap-npm)

---

## Findings Logged

The 3 CAUTIONs have been logged in `agent_docs/security/SECURITY_FINDINGS.md` as Findings #1, #2, #3 for visibility (session start / phase close / pre-deploy reflexes, if the project root CLAUDE.md adopts them). They are dep-vulnerability findings — the fix-path is `repo-security-audit` (Path B), not code change.

---

## Recommended Next Actions

1. **(Immediate)** Run **Path B — `repo-security-audit`** to apply the patches. Since fixes are within the existing caret ranges, the resolution is:
   - `rm -rf node_modules && npm install` (lockfile will be rebuilt with latest in-range versions)
   - OR `npm update next react react-dom` (surgical bump while preserving other pins)
   - Verify: `npm audit` should report 0 vulnerabilities. Build + test should pass.
2. **(Defensive)** Re-run this threat-landscape-check 7-14 days from now — the Mini Shai-Hulud campaign is still active and new packages are being compromised.
3. **(Optional hygiene — not security)** Consider planning major-version migrations for `zod` (3.x → 4.x), `tailwindcss` (3.x → 4.x), `@supabase/supabase-js` (2.44.x → 2.106.x), `@hookform/resolvers` (3.x → 5.x).

---

🛡️ *Report generated by `stark-repo-security-v1.1 / threat-landscape-check` — pure research, no state changes outside this file and the security ledger.*
