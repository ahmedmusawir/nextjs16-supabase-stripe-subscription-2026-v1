# Decision Tree: Finding vs Cleanup Item

> Use this in workflow/01-categorize.md when the operator hesitates between recording a discovery as a SECURITY FINDING (goes in `SECURITY_FINDINGS.md`) or a CLEANUP ITEM (goes in `CLEANUP_BACKLOG.md`).

## The Default Choice

**When in doubt, file it as a SECURITY FINDING.** Easier to demote later (move to backlog) than to miss something material. SECURITY_FINDINGS.md gets read more often (session start, phase close, pre-deploy) — the higher visibility costs little for false positives.

## The Core Distinction

| If the discovery has... | It's a... |
|---|---|
| A plausible attack vector | FINDING |
| Active data exposure (any class — PII, financial, PHI, credentials) | FINDING |
| Auth / authz gap | FINDING |
| Missing validation on a money or sensitive path | FINDING |
| No exploit path, no data exposure, no auth angle | CLEANUP |

If you can complete the sentence "an attacker could ___" with a meaningful answer, it's a FINDING.

## Decision Questions

### Q1: Could an attacker exploit this to do something undesired?

| Answer | Implication |
|---|---|
| Yes — specific exploit imaginable (read data, write data, escalate privilege, fraud) | **FINDING** |
| Maybe — vector is theoretical or requires implausible conditions | Continue to Q2 |
| No — purely a code health issue with no exploit path | **CLEANUP** |

### Q2: Does the issue expose sensitive data, even unintentionally?

| Answer | Implication |
|---|---|
| Yes — error messages contain stack traces, internal IDs, PII fragments | **FINDING** |
| Yes — logs include secrets, tokens, or session IDs | **FINDING** |
| Yes — API responses leak internal schema, query structure, or DB info | **FINDING** |
| No — but the data path *touches* sensitive data without leaking it | Continue to Q3 |
| No — issue is in a non-sensitive code path entirely | **CLEANUP** |

### Q3: Is this on a money path, auth path, or PHI/PII path?

| Path Type | Implication |
|---|---|
| Money (payment, refund, balance, pricing, discount) | **FINDING** (even LOW severity — money paths warrant the higher visibility) |
| Auth (login, session, password, MFA, RBAC) | **FINDING** |
| PHI/PII (user profile, health data, addresses, identifiers) | **FINDING** |
| Public/non-sensitive (marketing pages, public API, docs) | **CLEANUP** |

### Q4: What would a security reviewer say?

This is a sanity check. Imagine someone doing a code review specifically for security:
- Would they flag this in a security review? → **FINDING**
- Would they shrug and say "yeah, that's just code debt"? → **CLEANUP**

## Common Patterns

### Pattern A: Clear Finding (PII Leak)

`/api/users/route.ts` catches errors and returns `error.message` directly to the client. The error messages include DB constraint names, sometimes user emails, and occasional stack traces.

- Attack vector: information disclosure leading to targeted attack planning
- Data exposed: internal schema, sometimes user data
- Path type: API touching user data

**Decision: FINDING.** Severity: HIGH (PII fragments in error messages).

### Pattern B: Clear Finding (Missing Validation)

`/api/create-payment-intent` accepts `amount` from request body, passes to Stripe without validation.

- Attack vector: fraud — pay $0.01 for a $100 order
- Path type: money

**Decision: FINDING.** Severity: HIGH (active money path, fraud vector).

### Pattern C: Clear Cleanup (Dead Code)

`priceAfterDiscount()` function exists, has full logic, but is never called. Lives in a utility file. Was replaced by a different module 4 months ago.

- Attack vector: none (code never runs)
- Data exposed: none
- Path type: N/A (inert)

**Decision: CLEANUP.** Risk-if-left: VERY LOW.

### Pattern D: Clear Cleanup (Lint Warnings)

ESLint flags 18 unused imports across components.

- Attack vector: none
- Data exposed: none

**Decision: CLEANUP.** Risk-if-left: LOW.

### Pattern E: Borderline — Dead Code That Could Have Been A Vuln

A handler exists with SQL string concatenation. The handler is never called (dead route). If it WERE called, it would be a SQL injection vector. But it isn't.

- Currently exploitable: no
- Could become exploitable if "revived": yes

**Decision: FINDING with status FIXED-by-deletion.** Two-step: capture as finding (severity reflects what it would have been), then in the resolution note that the fix is deletion. The record exists so if anyone considers re-introducing the dead route in the future, the prior vuln is on the books.

### Pattern F: Borderline — Console.log With Data

`console.log(user)` in a server handler. Logs the full user object including emails. Logs go to a file that's only accessible to ops.

- Attack vector: if log access is compromised, PII exposure
- Severity depends on log access controls

**Decision: FINDING.** Severity: MEDIUM (depends on threat model — internal-only logs are different from public logs). Captures the risk; the resolution may be "remove the console.log" OR "redact the user object first."

### Pattern G: Borderline — Deprecated Framework Pattern

Next 15 deprecates sync `params` access. Project uses sync pattern. Build emits warnings. No current exploit.

- Attack vector: none currently
- Future risk: Next major bump removes the pattern, build breaks

**Decision: CLEANUP.** Risk-if-left: MEDIUM (will break on future upgrade, not a security issue).

## Common Mistakes

| Don't | Why |
|---|---|
| File EVERY warning as a Finding | Findings file becomes noise; real signals get lost |
| File a Finding as Cleanup because "it's not urgent" | Urgency doesn't determine category — exploit potential does. Status DEFERRED handles "not urgent" within Findings. |
| Skip categorization entirely and file in both | Duplicate entries fragment the record |
| File a dep vulnerability here | Dep vulns belong in the audit cycle, not the project's own ledger |
| File an infrastructure issue (e.g., missing TLS config) here | Infra issues belong in a deploy-readiness ledger, not the codebase findings |

## When Operator's Category Differs From This Tree's Recommendation

Per family doctrine Section 4.8 (Operator Override Protocol), the operator's call is final. If the tree says FINDING but operator wants CLEANUP:

1. Acknowledge the override
2. Note in the entry: "Operator-categorized as cleanup despite [security implication]"
3. Proceed with the operator's choice

This preserves the operator's authority while leaving a breadcrumb for future readers about the rationale.
