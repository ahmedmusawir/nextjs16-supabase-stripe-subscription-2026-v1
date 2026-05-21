# Workflow 04 — Execute (Phase 3)

> Apply the approved decisions from Phase 2, one at a time. Build verification between each per P7 (Build-Verify-Smoke At Every Step). State-change phase — each decision is already approved via the Phase 2 table, but individual commands still surface to the operator before run.

---

## Execution Order

Apply decisions in this order to minimize cascade risk:

1. **REMOVE decisions first** (eliminates deps cleanly before other changes shift the tree)
2. **OVERRIDE decisions next** (fixes transitive pins before parent upgrades that might re-shift)
3. **UPGRADE decisions third** (after the tree is stabilized)
4. **REPLACE decisions last** (involves code changes; deserves isolated focus)
5. **ACCEPT decisions** are documentation-only — no execution, just session log notes

Between each decision: build verification.

---

## REMOVE — Step 1

For each REMOVE decision:

> "Executing REMOVE on `<DEP>`. Per the approved Phase 2 table.
>
> Generate command:
>
> ```bash
> npm uninstall <DEP>
> ```
>
> If `@types/<DEP>` exists as a dev dep, also:
>
> ```bash
> npm uninstall @types/<DEP>
> ```
>
> Run and paste output."

Verify removal:

```bash
grep -rn "<DEP>" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . \
  | grep -v node_modules | head -10
```

EVIDENCE check: zero matches confirms clean removal.

Build verify:

```bash
npm run build
```

If build fails → STOP. Roll back this single decision:
```bash
git checkout package.json package-lock.json
npm ci
```
Investigate why the "unused" dep was actually needed. Surface to operator.

If build passes → proceed to next decision.

---

## OVERRIDE — Step 2

For each OVERRIDE decision:

> "Executing OVERRIDE on `<TRANSITIVE_DEP>`. Per P8 (Overrides For Stuck Transitives).
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
> Save the file. Then:
>
> ```bash
> rm package-lock.json
> npm install
> ```
>
> Paste output. Watch for `EOVERRIDE` errors — see ANTI_PATTERNS.md if encountered."

Verify override took effect:

```bash
npm ls <TRANSITIVE_DEP>
```

EVIDENCE check: all instances resolve to safe version, top-level entry marked `overridden`.

If `EOVERRIDE` error appears:

> "G-NPM-1 detected (`EOVERRIDE`). Per ANTI_PATTERNS.md:
> The direct devDep's declared range doesn't intersect the override range. Need to bump the direct devDep range first.
>
> Edit `package.json`: change the direct devDep declaration to a version that intersects the override range, then retry `npm install`."

Walk the operator through the fix, retry.

Build verify after each successful override:
```bash
rm -rf .next  # per G-NPM-2 anti-pattern
npm run build
```

---

## UPGRADE — Step 3

For each UPGRADE decision:

> "Executing UPGRADE on `<DEP>` → `<SAFE_VERSION>`.
>
> Generate command:
>
> ```bash
> npm install <DEP>@<SAFE_VERSION>
> ```
>
> Paste output."

Verify:
```bash
npm ls <DEP>
```

EVIDENCE: resolves to the expected version.

Build verify:
```bash
npm run build
```

If build fails on a "non-breaking" upgrade → P3 was wrong, this is actually breaking. Roll back this single decision, downgrade decision to MIGRATION DEFERRED, document in session log.

---

## REPLACE — Step 4

For each REPLACE decision (e.g., axios → native fetch):

> "Executing REPLACE on `<OLD_DEP>` → `<NEW_API>`. This involves code changes.
>
> Per family doctrine Section 4.1, code changes need explicit per-file approval. Plan:
>
> 1. Identify all call sites: [list from Phase 2 usage check]
> 2. For each call site, propose the replacement code
> 3. Operator reviews and APPROVES per file
> 4. After all sites converted, uninstall the old dep
>
> Ready to walk through call sites?"

This is the most operator-intensive decision type. Don't rush.

After all sites converted:
```bash
npm uninstall <OLD_DEP>
npm run build
npm test
```

---

## After All Decisions Executed — Final Per-Phase Check

```bash
npm audit
npm run build
npm test
```

Report:

> "Phase 3 execution complete.
>
> **Final state:**
> - `npm audit`: [N] vulns remaining (expected: 0 if all decisions executed cleanly, or [N for ACCEPTs])
> - `npm run build`: [PASS/FAIL]
> - `npm test`: [PASS/FAIL]
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
