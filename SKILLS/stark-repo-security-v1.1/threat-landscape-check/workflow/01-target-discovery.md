# Workflow 01 — Target Discovery

> Parse `package.json`, extract direct deps per the operator-confirmed scope, present the target list to the operator before research begins. Read-only.

---

## Step 1 — Locate package.json

Confirm `package.json` exists at the repo root (already verified during family-level environment discovery, but re-confirm cleanly):

```bash
test -f package.json && echo "EXISTS" || echo "MISSING — HALT"
```

If MISSING:
> "No `package.json` found in the current working directory. Cannot proceed without it. Confirm you're in the correct repo root, or stop the skill."

If EXISTS, continue.

---

## Step 2 — Extract Direct Deps

Use `node` to parse cleanly (handles edge cases that `grep` doesn't — multiline entries, quotes, etc.):

For **default scope (both lists)**:

```bash
node -e "
const pkg = require('./package.json');
const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
Object.entries(deps).forEach(([name, version]) => console.log(\`\${name}@\${version}\`));
" | sort
```

For **dependencies only**:

```bash
node -e "
const pkg = require('./package.json');
Object.entries(pkg.dependencies || {}).forEach(([name, version]) => console.log(\`\${name}@\${version}\`));
" | sort
```

For **custom list** (operator-provided): use the list directly.

If `node` isn't available, fall back to `jq`:

```bash
jq -r '.dependencies + .devDependencies | to_entries[] | "\(.key)@\(.value)"' package.json | sort
```

If neither available, parse manually with grep + sed (last resort).

---

## Step 3 — Count And Categorize

After extraction:

```bash
# Count
echo "Total direct deps: $(<output_count>)"

# Categorize for the report
echo "  - dependencies: $(<deps_count>)"
echo "  - devDependencies: $(<devDeps_count>)"
```

This count is reported up front so the operator knows the research scope.

---

## Step 4 — Present Target List

Show the operator what's about to be researched:

> "Target discovery complete. Found **[N] direct deps** to research:
>
> **dependencies ([N]):**
> - next@15.4.1
> - @supabase/supabase-js@2.45.3
> - @supabase/ssr@0.5.1
> - zod@3.22.4
> ... [more] ...
>
> **devDependencies ([N]):**
> - typescript@5.3.3
> - tailwindcss@3.4.1
> ... [more] ...
>
> Each will be researched against four vectors:
> 1. Recent CVE advisories (past 90 days)
> 2. Supply-chain attacks (past 30 days)
> 3. Maintainer ownership changes (past 6 months)
> 4. Typosquat / name-collision similarity check
>
> Estimated research time: roughly [N seconds per dep × N deps = total]. For repos with 15+ deps, this can take several minutes.
>
> Want me to proceed with all [N], or narrow further?"

The estimate matters because if the operator has 40+ deps, they may want to scope down before committing to the research time.

---

## Step 5 — Operator Confirms Or Narrows

Three common operator responses:

### Response A: "Proceed with all"
→ Move to Phase 2.

### Response B: "Just check the top 10 most critical"
→ Ask which 10. Or recommend a heuristic: `dependencies` only (skip devDeps), or "deps with 'auth', 'payment', 'crypto', 'supabase', 'stripe' in the name." Whatever they pick, narrow the list and confirm.

### Response C: "Add these extras I'm thinking about installing"
→ Append the operator-named packages to the list (these are hypothetical — not yet in `package.json`, but the operator wants to research them). Note them separately in the report ("**Hypothetical adds:** [list]").

---

## Step 6 — Lock The List

Once the operator confirms the final research list:

> "Locked. Researching these **[N] deps** against the four vectors. Moving to `workflow/02-threat-research.md`.
>
> I'll batch the web searches efficiently — typically one search can cover multiple deps if they share concern areas. Total estimated time: [N minutes]."

Move to Phase 2.

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| `package.json` parse error | Malformed JSON | Report the error; operator likely has a syntax issue in package.json to fix first (out of this skill's scope) |
| Empty deps lists | Project doesn't use npm deps (vendored, etc.) | Report empty result, suggest the skill isn't applicable here |
| 50+ deps in the list | Large project | Estimate research time honestly (could be 10+ minutes); recommend narrowing or running in parts |
| Operator names deps that don't exist on npm | Typo or hypothetical brand-new package | Note as "not found on npm" in the report — this is itself a red flag (typosquat or never-published) |

---

## Checkpoint

Target discovery complete when:

- [ ] `package.json` parsed successfully
- [ ] Direct deps extracted per scope (default or custom)
- [ ] Count + categorization reported
- [ ] Target list presented to operator
- [ ] Operator confirmed final list (or narrowed it)

Next file: `workflow/02-threat-research.md`
