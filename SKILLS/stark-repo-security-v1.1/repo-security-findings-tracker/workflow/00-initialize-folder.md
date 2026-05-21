# Workflow 00 — Initialize Folder

> Verify or create the `agent_docs/security/` folder where ledger files live. Per family doctrine Section 4.1, creating files is a state change — requires operator APPROVED.

---

## Step 1 — Check Folder State

```bash
test -d agent_docs/security && echo "EXISTS" || echo "MISSING"
ls -la agent_docs/security/ 2>/dev/null
```

### If EXISTS

Report current state:

```bash
test -f agent_docs/security/SECURITY_FINDINGS.md && echo "FINDINGS file exists"
test -f agent_docs/security/CLEANUP_BACKLOG.md && echo "BACKLOG file exists"
test -f agent_docs/security/README.md && echo "README exists"
```

Skip to the appropriate Step 2 (Path B or Path C).

### If MISSING

Recommend initialization:

> "No `agent_docs/security/` folder detected in this repo. First-run initialization will create:
>
> ```
> agent_docs/security/
> ├── SECURITY_FINDINGS.md     (with header, no entries yet)
> ├── CLEANUP_BACKLOG.md       (with header, no entries yet)
> └── README.md                (explains the folder)
> ```
>
> This is a state change. Approve initialization?"

After APPROVED, proceed to Step 2.

---

## Step 2 — Generate Initial Files

For each of the three files, generate the seed content and present it for the operator to save.

### `agent_docs/security/SECURITY_FINDINGS.md`

```bash
mkdir -p agent_docs/security
```

Then the content (use the template from `references/FINDINGS_TEMPLATE.md`):

> "Create `agent_docs/security/SECURITY_FINDINGS.md` with this content:
>
> [paste the file header template from references/FINDINGS_TEMPLATE.md]
>
> Save it."

### `agent_docs/security/CLEANUP_BACKLOG.md`

> "Create `agent_docs/security/CLEANUP_BACKLOG.md` with this content:
>
> [paste the file header template from references/BACKLOG_TEMPLATE.md]
>
> Save it."

### `agent_docs/security/README.md`

> "Create `agent_docs/security/README.md` with this content:
>
> ```markdown
> # Security Ledger — <PROJECT_NAME>
>
> This folder is the project's security ledger. Three files:
>
> - **SECURITY_FINDINGS.md** — Real security issues in this project's code (not third-party deps).
>   PII leaks, missing input validation, error message leaks, auth gaps. Tracked actively. Blocks
>   deploy if OPEN HIGH/CRITICAL entries exist.
>
> - **CLEANUP_BACKLOG.md** — Technical debt with security overtones — dead code, deprecated patterns,
>   lint warnings. Tracked passively, no deploy block.
>
> - **README.md** — This file.
>
> ## How To Add Entries
>
> Use the `stark-repo-security/repo-security-findings-tracker/` skill. Invocation:
>
> > "Claudy, go read the stark-repo-security folder and follow it. I want to record a new finding."
>
> The skill walks the capture conversationally and writes the entry here.
>
> ## How These Files Get Read
>
> The project's root `CLAUDE.md` should include security ledger reading reflexes (at session start,
> phase close, pre-deploy, code review) so the ledger functions as a deployment gate, not just a
> notepad. See `stark-repo-security/CLAUDE.md` Section 6.5 for the reflex template.
> ```
>
> Save it. Replace `<PROJECT_NAME>` with this project's name."

---

## Step 3 — Verify Initialization

```bash
ls -la agent_docs/security/
head -5 agent_docs/security/SECURITY_FINDINGS.md
head -5 agent_docs/security/CLEANUP_BACKLOG.md
head -5 agent_docs/security/README.md
```

EVIDENCE check: all three files present, each has expected header content.

---

## Step 4 — Proceed To Categorization

> "Initialization complete. `agent_docs/security/` is set up with empty ledgers.
>
> Moving to `workflow/01-categorize.md` to capture the finding you reported."

---

## Failure Modes To Watch

| Symptom | Likely Cause | Action |
|---|---|---|
| `agent_docs/` exists but no `security/` subfolder | Project uses agent_docs for other things | Create only the `security/` subfolder, don't touch siblings |
| Folder exists but ledger files missing | Partial initialization from prior session | Generate missing files only, keep existing |
| Operator refuses initialization | Doesn't want this convention | Surface to operator — without the folder, this skill can't write anywhere. Discuss alternative location or abort. |

---

## Checkpoint

Initialization complete when:

- [ ] `agent_docs/security/` folder exists
- [ ] `SECURITY_FINDINGS.md` exists with header
- [ ] `CLEANUP_BACKLOG.md` exists with header
- [ ] `README.md` exists explaining the folder
- [ ] Operator confirms ready to proceed

Next file (Path B): `workflow/01-categorize.md`
Next file (Path C status update): skip to `workflow/03-write-and-confirm.md`
