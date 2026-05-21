# Decision Tree: OVERRIDE vs MIGRATE

> Use this in Phase 2 (Triage) when an OVERRIDE is on the table but a major-version migration is also possible. Tension: override is fast and contained; migration is permanent but expensive.

## The Default Choice

**Default to OVERRIDE for a security audit.** Migration is a separate effort, not in scope for the audit. Per P5 (Safety Branch Always), audits stay focused. Migration goes in its own branch, own plan, own approval.

But there are cases where OVERRIDE is wrong and migration is the right call.

## Decision Questions

### Q1: Is the parent dep approaching EOL or already deprecated?

| Status | Action |
|---|---|
| Active, maintained | OVERRIDE (interim fix while waiting for parent update) |
| Maintenance mode (no new features, only security) | OVERRIDE (parent will likely fix this eventually) |
| Deprecated by author | **MIGRATE** (override only buys time; parent isn't coming back) |
| Fork required to maintain | **MIGRATE** (forking is also migration, just to a private fork) |

Check the parent's npm page or GitHub repo for deprecation notices.

### Q2: How many overrides are stacking up?

If `package.json` already has 3+ overrides for transitives pulled in by the same parent:

> "The parent dep is showing signs of being a long-term problem. Override-by-override is treating symptoms, not the cause. Consider migrating away from this parent."

**Threshold:**
- 1–2 overrides for a parent: OVERRIDE is fine
- 3+ overrides for same parent: **MIGRATE consideration**
- 5+ overrides for same parent: **MIGRATE strongly recommended**

### Q3: What's the migration cost?

Estimate:
```bash
grep -rn "from\s+['\"]<parent-dep>" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . \
  | grep -v node_modules | wc -l
```

| Migration Cost (call sites) | Lean Toward |
|---|---|
| 0–5 | MIGRATE (cheap, one-off effort) |
| 5–20 | Mixed — depends on Q1 and Q2 |
| 20+ | OVERRIDE (migration is its own project) |

### Q4: Is there a clear successor library?

For some deprecated parents, the path forward is obvious:
- `request` → `fetch`, `axios`, `got`
- `moment` → `dayjs`, `date-fns`
- `node-sass` → `dart-sass` (a.k.a. `sass`)
- `tslint` → `eslint`

If there's a clear, well-supported successor with good docs → **MIGRATE is easier**.

If the parent is unique or has no clean successor → **OVERRIDE** (no good migration target).

### Q5: Does the override actually work?

The most critical check. After applying the override:

```bash
rm package-lock.json
npm install
npm ls <transitive-dep>
```

If `npm ls` shows:
- All instances resolved to safe version ✅ — OVERRIDE works
- Peer dependency warnings ⚠️ — investigate; override may be unstable
- Resolution errors ❌ — OVERRIDE doesn't work, MIGRATE is forced

Per the family doctrine, "trust but verify with truth commands" (Section 4.6).

## Common Patterns

### Pattern A: Override Wins (Dockbloxx Case)

`next@15` pins `postcss@8.4.31`. Override forces `postcss@8.5.10`. `npm ls postcss` shows clean resolution. Next.js builds and tests pass. Single override, parent still active, fix lands in 5 minutes.

**Decision: OVERRIDE.** Migration would be massive (Next.js framework swap — never on the table for a security audit).

### Pattern B: Migration Forced

`tslint` is deprecated by maintainer. Has 12 vulnerabilities accumulated. Override would require 12 entries. Project has 8 `.tslintrc` references and uses tslint as a dev dependency.

**Decision: MIGRATE to `eslint`.** Plan as a separate effort, not in this audit. Document `tslint` vulns as ACCEPTed pending migration.

### Pattern C: Override Stacking Warning

`some-older-framework` already has overrides for `lodash`, `glob`, `minimist`, and `tar`. A 5th transitive vuln surfaces.

**Decision:** Stop adding overrides. Recommend MIGRATE consideration to operator. Document this audit's choice (override the 5th too OR ACCEPT and plan migration). Either way, the trajectory is clear — this parent dep needs to leave.

### Pattern D: Override Cosmetic (Don't Bother)

LOW severity vuln in a dev-only transitive used by a build tool that runs once per release. Override would technically work but adds maintenance burden for trivial risk.

**Decision: ACCEPT** with documented rationale. Don't override and don't migrate — the cost/benefit doesn't justify either.

## When To Defer To Operator Judgment

If after walking Q1–Q5 the decision is still ambiguous, surface the trade-off explicitly:

> "OVERRIDE vs MIGRATE on `<parent-dep>`:
>
> | Path | Pros | Cons |
> |---|---|---|
> | OVERRIDE | 5 minutes, contained in audit | Adds to override stack; parent still pulls in old API |
> | MIGRATE | Cleaner long-term, eliminates whole class of vulns | Out of scope for this audit; needs separate effort |
>
> My recommendation for this audit: OVERRIDE now, capture a 'consider migrating away from <parent>' entry in the cleanup backlog via repo-security-findings-tracker.
>
> Approve, or prefer to scope the migration into this session?"

Per family doctrine Section 4.8 (Operator Override Protocol), the operator's call is final.

## Common Mistakes

| Don't | Why |
|---|---|
| MIGRATE inside an audit | Migration is its own effort; audit scope is dep security, not architecture |
| OVERRIDE a parent that's deprecated | Buys time on a dying parent; better to plan the migration |
| Stack 5+ overrides without flagging | Override accumulation signals a parent dep is becoming a liability |
| ACCEPT without monitoring plan | "We'll deal with it later" without a calendar reminder is "we'll never deal with it" |
