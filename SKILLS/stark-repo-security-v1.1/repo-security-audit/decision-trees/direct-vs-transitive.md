# Decision Tree: Direct vs Transitive

> Use this in Phase 2 (Triage) when the vulnerability location is unclear, or when the operator questions whether a parent upgrade will actually fix a transitive vuln.

## The Core Principle

**Per P3 (Direct vs Transitive), verify the relationship before deciding the fix.** A vuln in a transitive dep is fixed differently than a vuln in a direct dep. Confusing them produces no-op fixes that waste a phase.

## Decision Questions

### Q1: Is the vuln in a direct dep or a transitive dep?

Run the truth command:
```bash
npm ls <DEP>
```

Read the output:

```
your-project@1.0.0 /path/to/project
├── <DEP>@x.y.z              <- DIRECT (top level)
```

vs.

```
your-project@1.0.0 /path/to/project
└── some-parent@a.b.c
    └── <DEP>@x.y.z           <- TRANSITIVE (nested under a parent)
```

vs. multiple parents pulling it in:
```
your-project@1.0.0 /path/to/project
├── parent-1@a.b.c
│   └── <DEP>@x.y.z
└── parent-2@d.e.f
    └── <DEP>@x.y.z
```

### Q2A: If DIRECT — go to remove-vs-upgrade decision tree

Direct vulns are handled by the REMOVE / REPLACE / UPGRADE decision tree. Stop here, switch to `remove-vs-upgrade.md`.

### Q2B: If TRANSITIVE — check the parent

The next question is whether upgrading the parent will fix it.

Run two commands:
```bash
# What version of <DEP> does the parent currently pin?
npm view <PARENT>@<CURRENT_PARENT_VERSION> dependencies.<DEP>

# What version of <DEP> does the parent's LATEST version pin?
npm view <PARENT>@latest dependencies.<DEP>
```

Output interpretation:

| Parent Latest Result | Meaning | Action |
|---|---|---|
| `undefined` or empty | Parent latest no longer depends on this dep | UPGRADE PARENT (parent dropped the bad transitive) |
| Newer/safe range (e.g., `^1.2.0` when vuln is `<1.1.5`) | Parent latest uses safe version | UPGRADE PARENT |
| Same/vulnerable range as current | Parent latest still pins the bad version | **OVERRIDE candidate per P8** |
| Older version than current | Parent regressed (unusual) | Investigate; likely OVERRIDE |

### Q3: If parent latest still pins vulnerable — is there an OVERRIDE option?

Per P8 (Overrides For Stuck Transitives), npm allows forcing a transitive version via the `overrides` block in `package.json`:

```json
{
  "overrides": {
    "<DEP>": "^<SAFE_VERSION>"
  }
}
```

This works IF the safe version satisfies the parent's actual API needs. Verify with:

```bash
# After applying the override and `npm install`:
npm ls <DEP>
```

EVIDENCE check: all instances resolve to safe version, top-level entry marked `overridden`. If `npm ls` shows resolution conflicts or peer warnings, the override may not work — the parent genuinely needs the older version's API.

### Q4: If override won't work — accept or fork?

In rare cases, the parent genuinely needs the vulnerable API surface, and no safe version of the transitive provides it. Options:

| Option | Trade-off |
|---|---|
| ACCEPT with monitoring | Document the risk, monitor for parent updates, plan revisit |
| Fork the parent | Maintain a private fork with the transitive bumped — high maintenance cost |
| Switch parent dep entirely | Find a competitor library that doesn't have this problem |
| Wait | If parent is actively maintained, the next release may fix it |

For most cases: **ACCEPT with monitoring** is the right call for non-critical severity. Fork only for prod-blocker situations.

## Common Patterns

### Pattern A: Standard Transitive, Parent Updateable

`postcss@8.4.31` is vulnerable. It's pulled in by `next@14.2.0`. `npm view next@latest dependencies.postcss` returns `^8.5.10`.

**Decision: UPGRADE PARENT (`next` to latest).** The transitive fix comes along for free.

### Pattern B: Parent Pin Stuck (Dockbloxx Case)

`postcss@8.4.31` is vulnerable. Pulled in by `next@15.0.0`. `npm view next@latest dependencies.postcss` returns `^8.4.31` (same vulnerable range).

**Decision: OVERRIDE.** Add `"overrides": { "postcss": "^8.5.10" }` to package.json.

### Pattern C: Multiple Parents

`semver@7.5.0` is vulnerable. Pulled in by 4 different parents. Each parent has different update paths.

**Decision: OVERRIDE.** Single fix point. Parent upgrades become optional/cosmetic — the override forces all instances to the safe version regardless of which parent.

### Pattern D: Direct AND Transitive Of Same Dep

Edge case: `lodash` is both a direct dep AND pulled in by 3 other libraries.

**Decision: Combine REMOVE/UPGRADE for the direct + OVERRIDE for transitive.** The direct decision is one thing; the transitive cleanup is another. Apply both.

## EOVERRIDE Trap (G-NPM-1)

If `npm install` after adding an override errors with `EOVERRIDE`, the override range doesn't intersect a direct devDep's declared range.

Example:
- `package.json` declares `"postcss": "^8.4.38"` as direct devDep
- Override declares `"postcss": "^8.5.10"`
- `^8.4.38` and `^8.5.10` overlap at `8.5.x` but npm checks intersection of the version constraint strings, not the resolved set

**Fix:** Bump the direct devDep range to match or exceed the override:
```json
"devDependencies": {
  "postcss": "^8.5.10"
}
"overrides": {
  "postcss": "^8.5.10"
}
```

See ANTI_PATTERNS.md G-NPM-1.

## Common Mistakes

| Don't | Why |
|---|---|
| Assume parent upgrade fixes transitive without `npm view` check | Parent may still pin the vulnerable version (Pattern B) |
| Override a transitive without running `npm ls` after install | Override may not propagate due to peer conflicts |
| Override when a parent upgrade is available | Wastes the override mechanism on something a clean upgrade would fix |
| Skip the `npm ls` after override | Trust but verify — overrides can silently fail to apply |
