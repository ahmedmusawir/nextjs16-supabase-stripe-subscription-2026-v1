# stark-repo-security

> **A Stark Skill bundle for the Stark Industries App Factory.**
>
> Three-skill family for keeping npm-based repos secure across their lifecycle: threat-landscape research, full security audits, and ad-hoc findings tracking.

This README is the on-ramp for engineers, Architects, and operators who haven't been in the conversations where this bundle was built. If you're picking this up cold — start here.

---

## What This Is

`stark-repo-security` is a **Stark Skill bundle** — a portable, stateless package of agentic-AI methodology that drops into any Cyberize repo (or any npm-based project) and gives a Claude Code session a clean way to handle dependency security work.

The bundle covers three distinct security workflows through three child skills:

1. **`threat-landscape-check/`** — Research-only. Scans `package.json`, web-researches each direct dep for active threats, reports PROCEED / CAUTION / HALT per dep. Never installs, never modifies. Run this **before** an audit or whenever supply-chain news raises suspicion.

2. **`repo-security-audit/`** — Full security audit. Six-phase workflow from baseline capture through triage, execution, bookkeeping, and re-baseline. Targets `npm audit` clean (zero vulnerabilities). Read-only until each phase's APPROVAL gate.

3. **`repo-security-findings-tracker/`** — Capture security findings or cleanup items discovered outside the audit cycle. Two branches: capture new finding/item, OR update status on an existing finding. Writes to the project's security ledger at `agent_docs/security/`.

All three share family-level doctrine (read-only default, no `--force` without dry-run, evidence discipline, operator override protocol) and route through a single FIRST QUESTION at activation.

---

## The Stark Skill Pattern

The bundle follows a specific architectural pattern developed in the Stark Industries App Factory:

```
SKILL_BUNDLE/
├── README.md                 ← This file. Onboarding for new readers.
├── CLAUDE.md                 ← Family doctrine. Always-on. Read first at activation.
│
├── child-skill-1/
│   ├── SKILL.md              ← Methodology only. Anthropic v2 format.
│   ├── workflow/             ← Phase files walked in order (00, 01, 02, ...)
│   ├── references/           ← Pulled on demand
│   └── decision-trees/       ← Walked when operator hesitates
│
├── child-skill-2/
│   ├── SKILL.md
│   └── ...
│
└── child-skill-3/
    └── ...
```

**Key invariants:**

- **Family doctrine lives at the bundle root** (`CLAUDE.md`). Always-on. Establishes identity, activation behavior, doctrine rules, routing logic, and key concepts. Child skills inherit from it.
- **No per-child CLAUDE.md.** Child skills focus on methodology, not doctrine. Doctrine duplication across child skills is an anti-pattern (would drift over time).
- **Child SKILL.md files follow Anthropic's v2 SKILL.md format** with YAML frontmatter (`name`, `description`, `allowed-tools`), under 500 lines, progressive disclosure.
- **Workflow files are numbered** (00, 01, 02...) and walked in order. Each is small, focused, and references the next.
- **References folder loaded on demand** — not at activation. The skill knows which references to pull and when.
- **Decision trees walked conversationally** — when the operator hesitates on a call, the skill walks the matching tree to surface trade-offs and recommend a default.

**Anthropic v2 SKILL.md format** is the canonical structure for individual skills as of mid-2025. Each child SKILL.md in this bundle uses the v2 format. The family CLAUDE.md is a Stark Skill addition (Anthropic's format covers a single skill; the family doctrine pattern extends it for multi-skill bundles).

---

## How To Use This Bundle

### Drop In

Place the unzipped `stark-repo-security/` folder at the root of any repo (or in a `tools/` or `skills/` subdirectory — your call). The bundle is stateless and portable. The same bundle works in any Cyberize repo identically.

### Activate

In Claude Code (or any agentic Claude session that can read files), tell the agent:

> "Go read the `stark-repo-security` folder and follow it."

Or any equivalent phrasing. The agent will:

1. Read `CLAUDE.md` end-to-end (family doctrine)
2. Run environment discovery (`pwd`, `ls`, check for `package.json`, etc.)
3. Ask **THE FIRST QUESTION**:
   > "Are you running a threat-landscape check, a security audit, recording a new finding, or updating an existing finding's status?"
4. Present a Plan Mode summary based on your answer
5. Wait for `APPROVED`
6. Engage the appropriate child skill

From there, the child skill walks its workflow files in order with verification gates between phases.

### Where Artifacts Land

The bundle is stateless — it **never modifies its own files** during normal operation. All project-specific artifacts (security findings, cleanup backlogs, audit logs, threat-check reports) land in the project's own `agent_docs/security/` directory:

```
<your-repo>/agent_docs/security/
├── SECURITY_FINDINGS.md           ← Real security issues, status-tracked
├── CLEANUP_BACKLOG.md             ← Technical debt with security overtones
├── README.md                      ← Auto-generated explaining the folder
└── threat-checks/                 ← Optional: dated threat-landscape reports
    └── YYYY-MM-DD-threat-check.md
```

If the folder doesn't exist when the skill first needs to write, the skill initializes it (with operator approval, per doctrine).

The skill bundle in `stark-repo-security/` is **identical** across every Cyberize repo. The `agent_docs/security/` content is **unique** to each project. Portability is preserved.

---

## Folder Structure

Generated with `tree -L 4 --noreport`:

```
stark-repo-security/
├── README.md
├── CLAUDE.md
├── threat-landscape-check/
│   ├── SKILL.md
│   ├── workflow/
│   │   ├── 00-intake.md
│   │   ├── 01-target-discovery.md
│   │   ├── 02-threat-research.md
│   │   └── 03-report.md
│   ├── references/
│   │   ├── RED_FLAGS.md
│   │   └── SEARCH_PATTERNS.md
│   └── decision-trees/
│       └── proceed-caution-halt.md
├── repo-security-audit/
│   ├── SKILL.md
│   ├── workflow/
│   │   ├── 00-pre-flight.md
│   │   ├── 01-baseline.md
│   │   ├── 02-safe-wins.md
│   │   ├── 03-triage.md
│   │   ├── 04-execute.md
│   │   ├── 05-bookkeep.md
│   │   └── 06-re-baseline.md
│   ├── references/
│   │   ├── PLAYBOOK.md
│   │   ├── DECISION_TEMPLATES.md
│   │   └── ANTI_PATTERNS.md
│   └── decision-trees/
│       ├── remove-vs-upgrade.md
│       ├── direct-vs-transitive.md
│       └── override-vs-migrate.md
└── repo-security-findings-tracker/
    ├── SKILL.md
    ├── workflow/
    │   ├── 00-initialize-folder.md
    │   ├── 01-categorize.md
    │   ├── 02a-capture-finding.md
    │   ├── 02b-capture-backlog.md
    │   └── 03-write-and-confirm.md
    ├── references/
    │   ├── FINDINGS_TEMPLATE.md
    │   └── BACKLOG_TEMPLATE.md
    └── decision-trees/
        └── finding-vs-cleanup.md
```

---

## What Each File Does

### Bundle Root

| File | Purpose |
|---|---|
| `README.md` | This file — onboarding for new readers |
| `CLAUDE.md` | Family doctrine. Always-on. Identity, activation, doctrine, routing, key concepts |

### `threat-landscape-check/`

| File | Purpose |
|---|---|
| `SKILL.md` | Methodology for threat-landscape research, Anthropic v2 format |
| `workflow/00-intake.md` | Confirm read-only, pick output level (Tight/Standard/Thorough), confirm scope |
| `workflow/01-target-discovery.md` | Parse `package.json`, extract direct deps |
| `workflow/02-threat-research.md` | Four research vectors per dep |
| `workflow/03-report.md` | Generate report at chosen level, optional file save, close out |
| `references/RED_FLAGS.md` | Signal classes and weighting |
| `references/SEARCH_PATTERNS.md` | Web-search query templates with date placeholders |
| `decision-trees/proceed-caution-halt.md` | Verdict logic |

### `repo-security-audit/`

| File | Purpose |
|---|---|
| `SKILL.md` | Methodology for full security audit, Anthropic v2 format |
| `workflow/00-pre-flight.md` | Repo confirmation, P11 threat check, safety branch |
| `workflow/01-baseline.md` | Capture starting vulnerability profile |
| `workflow/02-safe-wins.md` | Apply `npm audit fix` (NEVER `--force`) |
| `workflow/03-triage.md` | Per-vuln decision: REMOVE / UPGRADE / OVERRIDE / ACCEPT |
| `workflow/04-execute.md` | Apply decisions one at a time with build verification |
| `workflow/05-bookkeep.md` | CHANGELOG, session log, RECOVERY.md updates |
| `workflow/06-re-baseline.md` | Final verification: clean audit, clean build, clean tests |
| `references/PLAYBOOK.md` | The 12 security principles (P1-P12) with detailed rationale |
| `references/DECISION_TEMPLATES.md` | Triage table format, bookkeeping templates |
| `references/ANTI_PATTERNS.md` | Known failure modes (`EOVERRIDE`, `.next` cache, `--force` traps) |
| `decision-trees/remove-vs-upgrade.md` | When to remove a dep vs upgrade it |
| `decision-trees/direct-vs-transitive.md` | Vuln location and fix strategy |
| `decision-trees/override-vs-migrate.md` | Override stuck transitives vs migrate parent |

### `repo-security-findings-tracker/`

| File | Purpose |
|---|---|
| `SKILL.md` | Methodology for capture and status updates, Anthropic v2 format |
| `workflow/00-initialize-folder.md` | Create `agent_docs/security/` if missing |
| `workflow/01-categorize.md` | Finding vs cleanup decision |
| `workflow/02a-capture-finding.md` | Capture branch for SECURITY FINDINGS |
| `workflow/02b-capture-backlog.md` | Capture branch for CLEANUP ITEMS |
| `workflow/03-write-and-confirm.md` | Append to ledger, status updates, confirm |
| `references/FINDINGS_TEMPLATE.md` | Format for `SECURITY_FINDINGS.md` |
| `references/BACKLOG_TEMPLATE.md` | Format for `CLEANUP_BACKLOG.md` |
| `decision-trees/finding-vs-cleanup.md` | Categorization decisions |

---

## Doctrine Highlights

The full doctrine lives in `CLAUDE.md` §4. Key rules to know:

- **Read-only until approved** (§4.1) — security work starts with inspection. No silent fixes. State changes require explicit operator APPROVED.
- **No `npm audit fix --force` without dry-run review** (§4.2) — `--force` can downgrade frameworks; the dry-run is the only way to see what's coming before it lands.
- **Sharpness Rule** (§4.3) — if you can't explain why a change is being made, what breaks if it isn't made, what breaks if it IS made, which deps are affected, and whether it's reversible — don't propose it.
- **Plan Mode First** (§4.4) — present a plan before any state change. Wait for APPROVED.
- **Evidence Discipline** (§4.5) — label every claim: EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION.
- **Truth Commands** (§4.6) — verify state with a command, don't guess.
- **No Invention** (§4.7) — "NOT FOUND" or "QUESTION" beats a fabricated value.
- **Operator Override Protocol** (§4.8) — when the operator wants to skip doctrine, acknowledge, name the rule, state the failure mode, ask for explicit confirmation.

---

## Project-Root Reflexes (Recommended)

Skills in this bundle only **write** to the security ledger. The **value** comes from the ledger being **read** at the right moments. To activate that value, the project's own root `CLAUDE.md` (NOT this bundle's CLAUDE.md) should include reading reflexes that invoke the skills when appropriate. See `CLAUDE.md` §6.5 for the security ledger reading reflexes template.

A future sibling skill (`dep-add-threat-check/`, planned per the roadmap below) will be activated by a similar project-root reflex when the operator signals dependency-add intent during normal development.

---

## Version History

See `CLAUDE.md` §8 for the full version table. Current: **v1.2** (2026-05-21) — added §4.10 (Lockfile-First Audit) as a hard rule. The audit walks Phases 01-05 lockfile-only; `npm ci` is deferred to Phase 06 Step 1. Rationale: post-Mini-Shai-Hulud (May 2026) npm threat landscape — defer tarball fetches from the registry CDN until the lockfile is verified clean.

---

## Origin & Credits

This bundle was seeded from the **Dockbloxx security audit** (Cyberize, mid-September 2025 through May 2026) — an extended audit project that took an e-commerce production repo from 25 npm vulnerabilities (1 critical, 6 high, 16 moderate, 2 low) to zero, while also surfacing in-code security findings (PII leaks in error messages, missing input validation on payment endpoints). The playbook that emerged from that work (`repo-security-audit/references/PLAYBOOK.md`, 12 principles P1-P12) is the foundation.

The bundle was formalized as a Stark Skill in May 2026 during the Cyber Pharma SaaS build, following the Stark Industries App Factory's pattern for multi-skill bundles.

**Operator:** Tony Stark (alias: Moose / ahmedmusawir)
**Factory:** Stark Industries App Factory (Cyberize)

---

## Future Roadmap

Recorded for posterity. None of these are committed deliverables — they're directional notes for when the time comes.

| Item | Type | Notes |
|---|---|---|
| `dep-add-threat-check/` | Sibling skill | Single-package research before adding a new lib mid-development. Activated by project-root CLAUDE.md reflex on dependency-add intent. Sibling, not a child mode of `threat-landscape-check`. |
| `threat-monitor` | Infrastructure | Continuous monitoring (4x/day or similar), multi-repo, Slack/GitHub reporting. NOT a Stark Skill — operational infrastructure, separate effort. |
| Python/pip support | Skill extension | `threat-landscape-check` and the audit skill currently npm-only. Python support useful for ADK-based agent projects. |
| Stark Skill Builder Playbook | Documentation | Codified pattern (family doctrine + child SKILL.md + workflow + references + decision-trees) into a reusable playbook for building new skill bundles. To be written based on this bundle's experience. |

---

## About Stark Skills

A **Stark Skill** is a portable, stateless package of agentic-AI methodology that drops into a project and gives the AI session a clear, evidence-discipline-first way to do a specific class of work. Stark Skills are characterized by:

- **Family doctrine + child methodology separation** (CLAUDE.md vs SKILL.md)
- **Anthropic v2 SKILL.md format** for individual skills
- **Read-only-by-default posture** with explicit operator approval for state changes
- **Evidence discipline** (EVIDENCE / INFERENCE / CLAIM / GAP / QUESTION labeling)
- **Verifiable completion criteria** ("done" is measurable, not narrative)
- **Operator override protocol** (operator's authority is supreme; doctrine is surfaced, not silently overridden)
- **Stateless portability** (the bundle is identical across projects; project-specific state lives in `agent_docs/`)

The full Stark Skill Builder playbook is a future deliverable. This bundle, along with `CLOUD_DEPLOYMENT_SKILLS`, are reference implementations.

---

🛡️ **Questions, suggestions, or improvements: contact Tony Stark / open a discussion in the Stark Industries App Factory.**
