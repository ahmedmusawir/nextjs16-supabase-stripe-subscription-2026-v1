# ANTI_PATTERNS — repo-security-audit

> **Reference doc.** Known failure modes encountered during real audit executions, with their fixes. Pull when something behaves unexpectedly during any phase.

Each anti-pattern is named (e.g., `G-NPM-1`) so it can be referenced from workflow files and case studies.

---

## G-NPM-1 — `EOVERRIDE`: npm overrides must be reachable from a declared dep

**Symptom:** Adding an `overrides` entry for a transitive dep triggers an `npm error code EOVERRIDE` on install.

**Cause:** npm refuses an override whose range doesn't intersect a direct dependency's declared range. If the package isn't a direct dep at all, the override is accepted. If it IS a direct dep but at an older/narrower range than the override, you get `EOVERRIDE`.

**Fix:** Bump the direct devDep's declared range to a version that intersects the override range. Then `npm install` again.

**Example:** Adding `"overrides": { "postcss": "^8.5.10" }` when `package.json` declared `"postcss": "^8.4.38"` as a direct devDep. Bumped the direct devDep to `^8.5.10` to match the override range; install succeeded.

**Encountered:** 2026-05-17 during Dockbloxx audit Case Study #3a (postcss override).

---

## G-NPM-2 — `rm -rf .next` before final manual smoke

**Symptom:** After applying a dep change, the build succeeds and tests pass, but the manual smoke renders pre-upgrade behavior (or `next start` throws `routesManifest.dataRoutes is not iterable`).

**Cause:** Next.js's `.next` directory caches compiled artifacts that reference the previous dependency tree. Subsequent `next build` invocations can produce mixed-state artifacts that include stale references.

**Fix:** Delete `.next` between dep changes and the final smoke:

```bash
rm -rf .next && npm run build && npm start
```

This forces a complete rebuild against the current dep tree and writes a complete `routes-manifest.json`.

**When to apply:** As a habit at the end of Phase 3 (Execute) and before Phase 5 verification. Also as the first thing to try if `next start` errors on a manifest field.

**Encountered:** 2026-05-17 during Dockbloxx audit Case Study #3 — `next start` errored on `routesManifest.dataRoutes` until `.next` was wiped and rebuilt.

---

## G-NPM-3 — Stray files at parent directory level trigger multi-lockfile warning

**Symptom:** `next build` or `next dev` warns about "multiple lockfiles detected" even when there's clearly only one `package-lock.json` inside the repo. Worse, `npm ci` may install into an unexpected location.

**Cause:** Next.js walks UP the directory tree looking for `package.json` to determine the project root. If sibling repos or accidentally-copied files (e.g., a stray `package.json` from a different project) sit at the parent folder, Next.js detects them as competing roots.

**Fix:** Before running any install or build in a freshly-cloned repo, verify only the in-repo `package.json` exists:

```bash
ls package.json                       # must exist inside repo folder
ls ../package.json                    # MUST NOT exist (or it's a different project's root)
find .. -maxdepth 2 -name "package.json" -not -path "./node_modules/*" 2>/dev/null
```

Clean up any stray files at parent level before proceeding.

**Encountered:** Referenced as the reason audit pre-flight (workflow/00) includes the `pwd` + `ls package.json` checks — operating from the wrong directory level has been a real failure mode.

---

## G-NPM-4 — `--force` Downgrades A Framework

**Symptom:** `npm audit fix --force` resolves vulns but breaks the entire application — pages 404, build errors reference APIs that don't exist, dev server fails to start.

**Cause:** `--force` was allowed to downgrade Next.js (or another framework) to an old version that satisfies the vulnerability advisory. The vuln is "fixed" but the framework's API surface is now from years ago.

**Fix:** This is preventable, not recoverable mid-flight. Per family doctrine Section 4.2:

```bash
# ALWAYS dry-run first
npm audit fix --force --dry-run 2>&1 | grep -E "(install|major|breaking)"
```

If the dry-run shows a framework downgrade, REFUSE the `--force` run. Plan individual upgrades per dep instead.

If `--force` has already been run and downgraded the framework:
```bash
# Roll back to the safety branch's pre-fix state
git checkout package.json package-lock.json
npm ci
npm run build  # verify the framework is back
```

Then go to Phase 2 manual triage. Never run `--force` again on this audit.

**Encountered:** Documented as a known risk in Dockbloxx playbook v0.6 Section "When `npm audit fix --force` is a trap."

---

## G-NPM-5 — Lockfile Drift After Manual `package.json` Edit

**Symptom:** Operator manually edits `package.json` (e.g., to add an `overrides` block), then `npm ci` fails with mismatched lockfile error.

**Cause:** `package.json` declares the new state but `package-lock.json` still encodes the old state. `npm ci` requires byte-identical match.

**Fix:**
```bash
rm package-lock.json
npm install   # regenerates lockfile from current package.json
```

Then `npm ci` (in downstream environments) will honor the new state.

**When to apply:** After every manual `package.json` edit during Phase 3 (especially OVERRIDE decisions).

---

## G-NPM-6 — Audit Reports Inconsistent Counts Between Runs

**Symptom:** Running `npm audit` twice in a row produces different vulnerability counts.

**Cause:** Usually one of:
- Lockfile not committed and re-resolved between runs (different deps installed each time)
- npm registry cache freshness — new advisories published between runs
- Different `npm` versions producing different reports

**Fix:**
1. Commit the lockfile first: `git add package-lock.json && git commit -m "Lock for audit"`
2. Use `--json` output for ground truth: `npm audit --json | jq .metadata.vulnerabilities`
3. Confirm npm version: `npm --version` (audit behavior changed across major versions)
4. If counts still drift, freeze on a single npm version for the duration of the audit

---

## G-NPM-7 — `node_modules` Out Of Sync With Lockfile

**Symptom:** `npm audit` reports vulns that aren't in `package-lock.json`, or vice versa.

**Cause:** `node_modules` was modified without going through npm (manual edits, copied files, prior `--force` run that didn't propagate).

**Fix:**
```bash
rm -rf node_modules
npm ci  # strict install from lockfile
npm audit  # now reflects lockfile reality
```

If `npm ci` fails, the lockfile itself is inconsistent — regenerate per G-NPM-5.

---

## G-NPM-8 — Audit Passes Locally But Fails In CI

**Symptom:** Local `npm audit` shows 0 vulns, CI pipeline's audit step fails.

**Cause:** Usually one of:
- Local env has cached old advisory data; CI fetches fresh
- Local `node_modules` was edited; CI does clean install from lockfile
- Different `audit-level` thresholds between local and CI configs

**Fix:**
1. Locally reproduce CI's audit conditions:
   ```bash
   rm -rf node_modules
   npm ci
   npm audit --audit-level=moderate  # or whatever CI uses
   ```
2. If still passes locally but fails in CI, check CI's npm version vs local
3. If new advisory appeared between local audit and CI run, re-run audit cycle (this is good — CI caught a fresh issue)

---

## How To Reference These In Workflow Files

When a workflow file mentions "see ANTI_PATTERNS.md G-NPM-2," that file is meant to be opened at the named anti-pattern. Don't duplicate the fix in the workflow — reference here, fix lives here, single source of truth.

When new anti-patterns are discovered during real audits, append them to this file (with date and project of origin) and bump the audit skill version.
