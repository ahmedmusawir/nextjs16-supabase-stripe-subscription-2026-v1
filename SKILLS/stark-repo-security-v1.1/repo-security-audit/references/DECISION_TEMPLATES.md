# DECISION_TEMPLATES — repo-security-audit

> **Reference doc.** Triage table format, bookkeeping templates, override pattern, and quantification examples. Pulled during Phase 2 (Triage) and Phase 4 (Bookkeeping).

---

## Triage Decision Table Template (Phase 2)

Fill one row per remaining vulnerability after Phase 1 (safe wins applied). This is the artifact the operator reviews and APPROVES before Phase 3 execution.

| # | Dep | Severity | Direct/Transitive | Usage In Source | Usage In Docs | Proposed Decision | Reasoning |
|---|---|---|---|---|---|---|---|
| 1 | axios | High | Direct | 0 imports | 2 references | REMOVE | Aspirational install, replaced by native fetch elsewhere |
| 2 | postcss | Moderate | Transitive (next pins) | N/A | N/A | OVERRIDE | next@15 → 16 still pins same vulnerable transitive (P8) |
| 3 | swiper | Low | Direct | 4 imports | — | UPGRADE | Non-breaking patch v11.x → v11.x.y available |

---

## Decision Matrix (From Principle P2)

| Usage Pattern Observed | Recommended Decision | Notes |
|---|---|---|
| Zero imports anywhere in source | **REMOVE** | The dep you don't use is the vuln you don't need |
| Imported only in docs/examples | **REMOVE** | Aspirational install, likely planned and abandoned |
| Imported in dead code paths only | **REMOVE DEAD CODE + REMOVE DEP** | Two-step: clean code first, then uninstall |
| Used in 1–2 places, native API available | **REFACTOR + REMOVE** | e.g., axios → native fetch |
| Used pervasively, non-breaking patch available | **UPGRADE in place** | Standard `npm install <dep>@<safe-version>` |
| Used pervasively, breaking upgrade only | **PLAN MIGRATION** | Separate effort, Plan Mode, design + approve before executing |
| Transitive, parent has newer non-breaking version | **UPGRADE PARENT** | Standard upgrade fixes the transitive |
| Transitive, parent pins exact vulnerable version | **OVERRIDE (P8)** | npm `overrides` forces safe transitive version |
| Transitive, no override possible, no parent update | **ACCEPT WITH RATIONALE** | Document in session log + add monitoring |

---

## Pre-`audit fix --force` Safety Check Template

Per family doctrine Section 4.2, `--force` is NEVER run without dry-run review. The check pattern:

```bash
npm audit fix --force --dry-run 2>&1 | grep -E "(install|major|breaking)"
```

🚩 **Red flags that `--force` is UNSAFE:**

| Signal | Risk |
|---|---|
| Framework downgrade (e.g., Next 15 → 9.3.3) | Massive feature/API loss |
| "Major" version jump on UI lib (swiper, react, next) | Visual + API breakage |
| Cascade of breaking changes across multiple deps in one command | Untrackable regressions |
| Type system deps (typescript, @types/*) jumping major | Build breakage cascading |

If any red flag appears, **plan each breaking upgrade individually**. Never batch via `--force`.

---

## Transitive Vulnerability Investigation Template

When a vuln is in a transitive dep:

```bash
# Step 1: Read the tree to find the parent(s)
npm ls <transitive-dep>

# Step 2: Check if parent's latest version still pins it
npm view <parent>@<current-version> dependencies.<transitive-dep>
npm view <parent>@<latest-version> dependencies.<transitive-dep>
```

**Decision based on Step 2 output:**

| Step 2 Result | Action |
|---|---|
| Parent latest no longer depends on transitive | UPGRADE parent (standard fix) |
| Parent latest depends on transitive at safe version | UPGRADE parent (standard fix) |
| Both versions of parent pin the same vulnerable transitive | OVERRIDE per P8 (parent upgrade is no-op) |
| Parent has no newer version | OVERRIDE per P8 OR document as ACCEPT |

---

## Override Pattern Template

When applying P8 override:

```json
{
  "overrides": {
    "<vulnerable-transitive>": "^<safe-version>"
  }
}
```

Then:
```bash
rm package-lock.json
npm install
npm ls <vulnerable-transitive>
```

**Expected output of `npm ls`:** all instances of the transitive resolve to the safe version, top-level entry marked `overridden`.

### G-NPM-1 Recovery (`EOVERRIDE` error)

If `npm install` errors with `EOVERRIDE`:

1. Identify the conflicting direct devDep range in `package.json`
2. Bump the direct devDep range to a version that intersects the override range
3. Retry `npm install`

Example: Override `"postcss": "^8.5.10"` failed because `package.json` declared `"postcss": "^8.4.38"` as a direct devDep. Bumped direct to `^8.5.10` to match override range; install succeeded.

---

## Bookkeeping Entry Templates (Phase 4)

### CHANGELOG.md Entry

```markdown
## [Unreleased]

### Security

- Removed unused `<dep>` — eliminated [N] CVE advisories from dep graph
- Upgraded `<dep>` `<old-ver>` → `<new-ver>` — patches CVE-YYYY-NNNN (severity: <level>)
- Overrode transitive `<dep>` to `<safe-ver>` via npm overrides — parent pins vulnerable version (origin: P8)
- Applied `npm audit fix` — auto-patched [N] safe wins

### Removed

- `<dep>` — unused dependency, removed during YYYY-MM-DD security audit (zero imports across source)
```

### Session Log Entry

```markdown
## Security Audit — YYYY-MM-DD

**Operator:** Tony
**Skill:** repo-security-audit v1.0
**Safety branch:** `security-audit-YYYY-MM-DD`

### Threat-landscape check (P11)
- Search performed: YYYY-MM-DD HH:MM
- Active threats found: [yes/no — list if yes]
- Overlap with project deps: [yes/no]
- Decision: PROCEED

### Vulnerability profile
- **Phase 0 baseline:** [N] total ([C crit] / [H high] / [M mod] / [L low])
- **Phase 1 after safe wins:** [N] total
- **Phase 5 final:** 0 vulnerabilities

### Decisions executed
| Dep | Decision | Outcome |
|---|---|---|
| ... | REMOVE | -[N] CVE advisories eliminated |
| ... | UPGRADE | non-breaking, build/tests clean |
| ... | OVERRIDE | per P8, parent pin confirmed |

### Bonus findings captured
- [N] findings logged to `agent_docs/security/SECURITY_FINDINGS.md`
- [N] items logged to `agent_docs/security/CLEANUP_BACKLOG.md`

### Final state
- `npm audit`: 0 vulnerabilities ✅
- `npm run build`: PASS ✅
- `npm test`: PASS ✅
- Bookkeeping: CHANGELOG / session log / RECOVERY.md ✅
```

### RECOVERY.md Pointer

```markdown
## Last Action

**Date:** YYYY-MM-DD
**Action:** Security audit completed. Repo at 0 vulnerabilities.
**Safety branch:** `security-audit-YYYY-MM-DD` (ready to merge to main)
**Lockfile:** authoritative (regenerated from clean package.json)
**Next:** Merge safety branch when ready, then resume planned work.
```

---

## Quantification Note (Principle P6)

Don't report removals in vuln-count alone. The interesting metric is **CVE-advisory-count eliminated from the dep graph**, not just headline tally.

Example:
- `npm audit` shows: "removed 1 vulnerability"
- Actual impact: removing `axios` eliminated 18 CVE advisories from the transitive tree (multiple deps within axios's own dep graph were vulnerable)

Always include both numbers in CHANGELOG and session log when meaningful.
