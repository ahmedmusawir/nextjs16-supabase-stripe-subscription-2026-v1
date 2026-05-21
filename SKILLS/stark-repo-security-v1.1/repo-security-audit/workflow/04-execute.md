# Workflow 04 — Execute (Phase 3)

> Apply the approved decisions from Phase 2, one at a time. Per family doctrine §4.10 (Lockfile-First Audit), **all execution is lockfile-only** via the `--package-lock-only` flag — no `node_modules` touch. Build + test verification is consolidated at Phase 06 (P7 is satisfied by the final batched verify, not inline). State-change phase — each decision is already approved via the Phase 2 table, but individual commands still surface to the operator before run.

---

## Execution Order

Apply decisions in this order to minimize cascade risk in the lockfile:

1. **REMOVE decisions first** (eliminates entries cleanly before other changes shift the tree)
2. **OVERRIDE decisions next** (fixes transitive pins before parent upgrades that might re-shift)
3. **UPGRADE decisions third** (after the tree is stabilized)
4. **REPLACE decisions last** (involves code changes; deserves isolated focus)
5. **ACCEPT decisions** are documentation-only — no execution, just session log notes

Between each decision: re-run `npm audit` to confirm the lockfile remains coherent (no new vulns surfaced from the dep-tree shift). **Do NOT** run build/test inline — those happen once at Phase 06.

---

## REMOVE — Step 1

For each REMOVE decision:

> "Executing REMOVE on `<DEP>`. Per the approved Phase 2 table and §4.10 (lockfile-only).
>
> Generate command:
>
> ```bash
> npm uninstall <DEP> --package-lock-only
> ```
>
> If `@types/<DEP>` exists as a dev dep, also:
>
> ```bash
> npm uninstall @types/<DEP> --package-lock-only
> ```
>
> Run and paste output."

Verify removal at the source level (this is grep against source files — no `node_modules` needed):

```bash
grep -rn "<DEP>" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . \
  | grep -v node_modules | head -10
```

EVIDENCE check: zero matches confirms clean removal at source level.

Verify lockfile state:

```bash
npm audit
```

If new vulns appear → STOP. Investigate the dep-tree shift. Surface to operator.

If clean → proceed to next decision. **Build verification deferred to Phase 06 per §4.10.**

If at Phase 06 the build later fails because of this REMOVE: roll back via `git checkout package.json package-lock.json` (no `npm ci` needed yet — nothing installed).

---

## OVERRIDE — Step 2

For each OVERRIDE decision:

> "Executing OVERRIDE on `<TRANSITIVE_DEP>`. Per P8 (Overrides For Stuck Transitives) and §4.10 (lockfile-only).
>
> Edit `package.json` to add (or extend) the `overrides` block:
>
> ```json
> {
>   "overrides": {
>     "<TRANSITIVE_DEP>": "^<SAFE_VERSION>"
>   }
> }
> ```
>
> Save the file. Then refresh the lockfile (lockfile-only — no install):
>
> ```bash
> npm install --package-lock-only
> ```
>
> Paste output. Watch for `EOVERRIDE` errors — see ANTI_PATTERNS.md if encountered."

Verify override took effect at lockfile level:

```bash
npm ls <TRANSITIVE_DEP> --package-lock-only
```

EVIDENCE check: all instances resolve to safe version in the lockfile, top-level entry marked `overridden`.

If `EOVERRIDE` error appears:

> "G-NPM-1 detected (`EOVERRIDE`). Per ANTI_PATTERNS.md:
> The direct devDep's declared range doesn't intersect the override range. Need to bump the direct devDep range first.
>
> Edit `package.json`: change the direct devDep declaration to a version that intersects the override range, then retry `npm install --package-lock-only`."

Walk the operator through the fix, retry.

Re-run `npm audit` after each successful override. **Build verification deferred to Phase 06 per §4.10.**

---

## UPGRADE — Step 3

For each UPGRADE decision:

> "Executing UPGRADE on `<DEP>` → `<SAFE_VERSION>`. Per §4.10 (lockfile-only).
>
> Generate command:
>
> ```bash
> npm install <DEP>@<SAFE_VERSION> --package-lock-only
> ```
>
> Paste output."

Verify:
```bash
npm ls <DEP> --package-lock-only
npm audit
```

EVIDENCE: resolves to the expected version in the lockfile; no new vulns surfaced.

**Build verification deferred to Phase 06 per §4.10.** If Phase 06 build fails on a supposedly non-breaking upgrade → P3 was wrong, this is actually breaking. Roll back this single decision via `git checkout package.json package-lock.json`, downgrade decision to MIGRATION DEFERRED, document in session log, re-run Phase 06.

---

## REPLACE — Step 4

For each REPLACE decision (e.g., axios → native fetch):

> "Executing REPLACE on `<OLD_DEP>` → `<NEW_API>`. This involves code changes.
>
> Per family doctrine §4.1, code changes need explicit per-file approval. Plan:
>
> 1. Identify all call sites: [list from Phase 2 usage check]
> 2. For each call site, propose the replacement code
> 3. Operator reviews and APPROVES per file
> 4. After all sites converted, uninstall the old dep (lockfile-only):
>
> ```bash
> npm uninstall <OLD_DEP> --package-lock-only
> ```
>
> Ready to walk through call sites?"

This is the most operator-intensive decision type. Don't rush.

After all sites converted + uninstall:
```bash
npm audit
```

EVIDENCE: lockfile clean. **Build + test verification deferred to Phase 06 per §4.10.**

---

## After All Decisions Executed — Final Lockfile Check

```bash
npm audit
```

Report:

> "Phase 3 execution complete (lockfile-only per §4.10).
>
> **Final lockfile state:**
> - `npm audit`: [N] vulns remaining (expected: 0 if all decisions executed cleanly, or [N for ACCEPTs])
> - `node_modules`: NOT touched — install deferred to Phase 06 Step 1
>
> **Decisions executed:** [N REMOVE / N OVERRIDE / N UPGRADE / N REPLACE]
> **Decisions deferred:** [N MIGRATIONS / N ACCEPTs]
>
> Ready for Phase 4 — Bookkeeping?"

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| Build fails after REMOVE | Dep was actually used (grep missed it — dynamic require, computed import) | Roll back single decision, reinvestigate usage |
| `EOVERRIDE` on first override | G-NPM-1 (direct devDep range conflict) | Walk ANTI_PATTERNS.md fix |
| `next start` errors with manifest field | G-NPM-2 (.next cache stale) | `rm -rf .next && npm run build` |
| Tests fail but build passes | Behavior changed in upgraded dep | Investigate test, may be legitimate breakage requiring code fix |
| Override doesn't propagate | Lockfile not regenerated | `rm package-lock.json && npm install` |

---

## Checkpoint

Phase 3 complete when:

- [ ] Each approved decision executed in order
- [ ] Build verification PASS after each decision
- [ ] Final `npm audit`, build, tests all GREEN (or ACCEPT-explained)
- [ ] No rollbacks pending
- [ ] Operator confirms ready for Phase 4

Next file: `workflow/05-bookkeep.md`
