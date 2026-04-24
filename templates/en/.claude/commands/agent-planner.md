# /agent-planner command

Starts the planning agent (planner). The parent Claude handles Q&A with the user, then launches the sub-agent in a single shot to generate the plan-report.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after Q&A is complete.

## Execution flow

### Step 1: Read upstream reports

Search and read the latest reports in the following order:

1. Search for `.claude/reports/requirements-report-*.md` using Glob → read the latest if found
2. Search for `.claude/reports/architecture-report-*.md` using Glob → read the latest if found

### Step 2: Q&A

**Always conduct the Q&A** regardless of whether upstream reports (requirements-report / architecture-report) or an existing plan-report are present (Q1's skip condition is described below).

Milestone mode, priorities, and per-agent notes are user-judgment matters and cannot be derived from existing reports. Do not skip Q&A just because upstream reports are available.

Output the following questions one by one as text and wait for the user's response (output one question at a time, then proceed after receiving the answer).

**Q1: Milestone mode confirmation**

(Ask only for large-scale development with many tasks or multiple phases. Skip for small-scale plans.)

```
Choose the behavior after completing each milestone:
  [confirm] After each milestone completes and is committed, show a "continue?" confirmation dialog
            (choose this if you may want to stop partway through)
  [auto]    After each milestone completes and is committed, automatically proceed to the next milestone without asking
            (choose this if you want to finish the whole thing today)
```

**Q2: Priority and order of work**

```
Are there any particular priorities for this plan?

- Is there a feature or task you want tackled first?
- Are there any tasks that can be deferred?
- Are there any items that can be out of scope for this cycle?
```

**Q3: Notes for each agent**

```
Are there any special notes for each agent?

- Notes for the developer (things to be careful about during implementation)
- Notes for the tester (areas to test thoroughly)
- Notes for reviewers (areas to review thoroughly)

If none, answer "none".
```

### Step 3: Organize Q&A results

Organize the user's answers into the following structure:
- milestone_mode (confirm / auto / none)
- Priority tasks and tasks that can be deferred
- Special notes for each agent

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: planner` via the Agent tool. Include the following in the prompt:

```
## Work request
Create work plan report (plan-report)

## Upstream report paths
- requirements-report: {path or "none"}
- architecture-report: {path or "none"}

## Q&A results with user

### Q1: Milestone mode
A: {confirm / auto / not applicable for small scale}

### Q2: Priority and order
A: {answer}

### Q3: Notes for each agent
A: {answer}

## Output instructions
- Output destination: `.claude/reports/plan-report-*.md` (via write-report.js)
- If milestones exist, the plan-report must include `milestone_mode: {confirm|auto}` at the top in the meta-info section
- The final message must include the report file path (format: `File: .claude/reports/plan-report-YYYYMMDD-HHmmss.md`)
- Do not use AskUserQuestion / SendMessage
- Exit after generating the report (approval confirmation is handled by the parent Claude)
```

The sub-agent prompt must also include the following YAML frontmatter output rules:

```
## YAML Frontmatter Output Rules

Output a YAML frontmatter block at the very beginning of the plan-report (before the Markdown body)
**only when all three conditions below are met**. Omit the frontmatter entirely otherwise.

**Conditions:**
1. Two or more task groups exist that can be implemented independently (no mutual dependencies)
2. The files each group handles can be clearly separated
3. Shared interfaces and type definitions can be finalized in advance

**Format:**

---
phase_scales:
  developer: medium   # default scale for the developer phase (small | medium | large)
  reviewer: small     # default scale for the reviewer phase (small | medium | large)

parallel_groups:
  pre_implementation:          # Lead group (omit this key entirely if not needed)
    tasks: [T0]
    agent: worktree-developer
    read_only: false
    writes:
      - src/types/shared.ts
  group-a:
    name: {group name}
    tasks: [T1, T2]
    agent: worktree-developer
    depends_on: [pre_implementation]   # only when pre_implementation exists
    read_only: false
    writes:
      - src/user/**
  group-b:
    name: {group name}
    tasks: [T3, T4]
    agent: worktree-developer
    depends_on: [pre_implementation]
    read_only: false
    writes:
      - src/auth/**
---

## Scale specification (phase_scales)

Write `phase_scales` at the top of the frontmatter (above `parallel_groups`).
Specify small / medium / large for each phase.

### Scale selection criteria
Use qualitative judgment based on task size and complexity. The following are guidelines:

| scale  | Approximate task count | Scenario |
|--------|------------------------|----------|
| small  | 1–2 | Small fixes, adding a single file |
| medium | 3–5 | Typical feature addition (default) |
| large  | 6+  | Large-scale refactors, simultaneous updates across multiple subsystems |

Task count is a guideline — even a single task can be large if it involves heavy I/O or a slow build.

### Per-group overrides
In principle, only write `phase_scales`. If a specific group needs a different timeout, write `timeout_sec` directly on that group (group direct values take priority over phase_scales).

```yaml
  group-heavy:
    tasks: [T5]
    agent: worktree-developer
    timeout_sec: 3600  # extend for this group only (overrides phase_scales)
    read_only: false
    writes:
      - src/heavy/**
```

**Field descriptions:**

| Field | Description |
|---|---|
| `phase_scales` | Per-phase scale map. Keys are phase names (`developer` / `reviewer`), values are `small` / `medium` / `large` |
| `parallel_groups` | Map of groups. Keys are `pre_implementation` / `group-a` / `group-b` / ... |
| `group-*.name` | Display name for the group |
| `group-*.tasks` | List of task IDs handled by this group (use inline notation `[T1, T2]`) |
| `group-*.agent` | Agent to run. Use `worktree-developer` for parallel implementation, `code-reviewer` / `security-reviewer` for parallel review |
| `group-*.timeout_sec` | Total execution time limit (seconds). Normally auto-resolved from `phase_scales`; omit unless overriding individually |
| `group-*.read_only` | YAML boolean (`true` / `false`). Use `false` for `worktree-developer`, `true` for `code-reviewer` / `security-reviewer` |
| `group-*.writes` | File patterns this group writes to (**no overlap between groups**; omit for `read_only: true` groups) |
| `group-*.depends_on` | List of dependency group keys (use inline notation `[pre_implementation]`) |

**File pattern syntax:**
- `src/user/**` — all files under `src/user/`
- `src/types/user.ts` — a single specific file
- `src/**/*.ts` — all `.ts` files under `src/`

**Example with `read_only: true` (parallel review):**
```yaml
---
phase_scales:
  reviewer: small     # default scale for the reviewer phase

parallel_groups:
  code-reviewer:
    phase: reviewer          # picked up by clade-parallel in the reviewer phase
    tasks: [review]
    agent: code-reviewer
    read_only: true
    # cwd is auto-prefixed with ../.. by plan-to-manifest.js (no need to set)
    # idle_timeout_sec is not needed — runner.py forces it to None for read_only tasks
  security-reviewer:
    phase: reviewer
    tasks: [security]
    agent: security-reviewer
    read_only: true
    # cwd is auto-prefixed with ../.. by plan-to-manifest.js (no need to set)
---
```
```

For regeneration after rejection, add the following to the prompt:
```
## Regeneration mode
- Previous report: {previous report path}
- User's revision instructions: {instructions}
```

### Step 5: Receive report path

Extract the report file path from the sub-agent's final output using the regex `.claude/reports/plan-report-\d{8}-\d{6}\.md`.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The work plan report has been saved to `{file path}`. Please review the content — do you approve this plan? (yes / no)
If revisions are needed, please describe them.
```

### Step 7: Record approval

To prevent shell injection, pass the comment via a tmp file:

1. Run `node .claude/hooks/clear-tmp-file.js --path .claude/tmp/approval-comment.md`
2. Use the Write tool to save the user's approval comment to `.claude/tmp/approval-comment.md` (empty string if no comment)
3. Run:

```bash
node .claude/hooks/record-approval.js {filename} {yes|no} plan --comment-file .claude/tmp/approval-comment.md
```

### Step 8: Restart on rejection

If rejected, repeat from Step 4 with a new prompt that includes the revision instructions and the previous report path.

---

## Purpose
- Creating work plans based on requirements and architecture reports
- Assigning tasks to each agent
- Creating work plan reports (`plan-report-*.md`)

## Notes
- Does not edit or write to source files
- On first call, only reference `requirements-report` and `architecture-report` (test/review reports do not yet exist, so skip them)
- On update calls, reference all reports to reflect differences (follow the execution mode detection logic in the planner skill file)
