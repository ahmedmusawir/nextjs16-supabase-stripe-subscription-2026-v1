# Decision Tree: REMOVE vs UPGRADE

> Use this in Phase 2 (Triage) when the operator hesitates between removing a vulnerable dep entirely vs upgrading it to a safe version.

## The Default Choice

**REMOVE wins if usage is zero or trivial.** Per P2 (Remove > Replace > Upgrade > Patch), the dep you don't have is the vuln you don't need. Default to REMOVE unless evidence pushes you toward UPGRADE.

## Decision Questions

### Q1: How many source imports does the dep have?

Run the grep:
```bash
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
     -E "(from\s+['\"]<DEP>['\"]|require\(['\"]<DEP>['\"]\))" . \
  | grep -v node_modules | grep -v ".next/" | wc -l
```

| Import Count | Lean Toward |
|---|---|
| 0 | **REMOVE** (no usage = no need) |
| 1–2 | Check Q2 (replaceable with native API?) |
| 3–5 | Check Q3 (upgrade complexity?) |
| 6+ | **UPGRADE** (rip-out cost too high for an audit) |

### Q2: Can the dep be replaced with a native API or smaller alternative?

| Dep | Native Replacement |
|---|---|
| `axios` | `fetch` (now stable in Node 18+) |
| `lodash` (full) | Most utilities have native equivalents or smaller alternatives |
| `moment` | `date-fns`, `dayjs`, or native `Intl.DateTimeFormat` |
| `request` | `fetch` |
| `uuid` (small uses) | `crypto.randomUUID()` (Node 14+) |
| `chalk` (server-only) | Native ANSI codes for simple cases |

If yes → **REPLACE + REMOVE** (count this as a REMOVE for the decision matrix, with a code-change note in the Phase 3 plan).

If no → continue to Q3.

### Q3: Is the upgrade non-breaking?

Check:
```bash
npm view <DEP> versions --json | tail -30
```

Look at the version that resolves the vuln:
- Same major version as currently installed → **UPGRADE** (non-breaking, safe path)
- Major version jump → check Q4

### Q4: Does the major version jump have known breaking changes?

Read the dep's CHANGELOG or release notes for the major version transition. Common breaking-change patterns:
- API signature changes
- Default behavior changes (e.g., strict mode)
- Removed exports
- Dependency requirement changes (new minimum Node version)

| Breaking Changes | Decision |
|---|---|
| None or trivial (TypeScript types only) | **UPGRADE** |
| Documented but small (1–2 call sites need updates) | **UPGRADE WITH CODE CHANGES** (treat like REPLACE) |
| Significant API surface change | **PLAN MIGRATION** (separate effort, not in this audit) |
| Framework-level dep (next, react) | **PLAN MIGRATION** (always separate) |

### Q5: Is the dep dev-only or production?

```bash
grep -A 2 "\"<DEP>\":" package.json
```

- `dependencies` → production, more conservative (upgrade carefully)
- `devDependencies` → can be more aggressive with version jumps

This doesn't change the decision but informs the risk tolerance.

## Common Patterns

### Pattern A: Aspirational Install

`axios` installed 6 months ago "to use for API calls," but `fetch` was used everywhere instead. Zero imports. Tests don't reference it. Docs have one example mentioning it.

**Decision: REMOVE.** Easy win.

### Pattern B: Library With Native Equivalent

`lodash` used in 4 files, mostly for `_.pick`, `_.isEmpty`, and `_.uniq`. All have native equivalents (`Object.fromEntries`, simple checks, `[...new Set(arr)]`).

**Decision: REPLACE + REMOVE.** Code change effort: ~15 minutes per file.

### Pattern C: Pervasive, Non-Breaking Patch

`swiper` used in 12 component files. Vuln is in `swiper@11.1.5`, patched in `swiper@11.1.9`. Both are same major.

**Decision: UPGRADE.** Standard `npm install swiper@11.1.9`.

### Pattern D: Pervasive, Major Bump Required

`react-query@3.x` (which is deprecated) used in 20+ files. Vuln resolved only in `@tanstack/react-query@4.x` (renamed package, breaking import paths).

**Decision: PLAN MIGRATION.** Not appropriate for an audit. Open a separate effort to migrate v3 → v4.

## Critical Rule: Don't Remove What's Hidden

Some deps are imported indirectly (e.g., a build plugin pulled in by `next.config.js` or a CSS framework pulled in by `tailwind.config.js`). Standard grep won't catch these.

Before REMOVE, also check:
```bash
grep -rn "<DEP>" --include="*.config.*" --include="*.js" --include="*.ts" --include="*.mjs" .
grep -rn "<DEP>" --include="*.json" . | grep -v package-lock
```

If found in config files → it's used. UPGRADE instead of REMOVE.

## Common Mistakes

| Don't | Why |
|---|---|
| REMOVE without grepping config files | Build plugins and config dependencies often skipped by source-only grep |
| UPGRADE across a major version without reading breaking changes | "Worked for a small test" doesn't mean it works for the whole codebase |
| Accept the dep's own claim of "non-breaking" without verifying | Some maintainers underestimate breaking impact |
| Skip the dev/prod distinction | Dev-only deps can take aggressive bumps; prod deps need caution |
