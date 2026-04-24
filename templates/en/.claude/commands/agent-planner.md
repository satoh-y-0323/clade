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
parallel_groups:
  pre_implementation:          # Lead group (omit this key entirely if not needed)
    tasks: [T0]
    agent: worktree-developer
    timeout_sec: 900           # small: 900 / medium: 1800 / large: 3600
    idle_timeout_sec: 600      # small: 600 / medium: 900 / large: 1200 (accounts for worktree startup 60-120s + read time)
    read_only: false
    writes:
      - src/types/shared.ts
  group-a:
    name: {group name}
    tasks: [T1, T2]
    agent: worktree-developer
    depends_on: [pre_implementation]   # only when pre_implementation exists
    timeout_sec: 1200
    idle_timeout_sec: 600
    read_only: false
    writes:
      - src/user/**
  group-b:
    name: {group name}
    tasks: [T3, T4]
    agent: worktree-developer
    depends_on: [pre_implementation]
    timeout_sec: 1200
    idle_timeout_sec: 600
    read_only: false
    writes:
      - src/auth/**
---

**Field descriptions:**

| Field | Description |
|---|---|
| `parallel_groups` | Map of groups. Keys are `pre_implementation` / `group-a` / `group-b` / ... |
| `group-*.name` | Display name for the group |
| `group-*.tasks` | List of task IDs handled by this group (use inline notation `[T1, T2]`) |
| `group-*.agent` | Agent to run. Use `worktree-developer` for parallel implementation, `code-reviewer` / `security-reviewer` for parallel review |
| `group-*.timeout_sec` | Total execution time limit (seconds). Default 900 when omitted. Adjust based on estimated duration of the parallel section |
| `group-*.idle_timeout_sec` | Silence time limit (seconds). **Required for worktree-developer** (small: 600 / medium: 900 / large: 1200). **Must not be set** for `read_only: true` groups (runner.py forces it to None) |
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
parallel_groups:
  code-reviewer:
    phase: reviewer          # picked up by clade-parallel in the reviewer phase
    tasks: [review]
    agent: code-reviewer
    timeout_sec: 600         # small: 600 / medium: 1800 / large: 9000
    read_only: true
    # cwd is auto-prefixed with ../.. by plan-to-manifest.js (no need to set)
  security-reviewer:
    phase: reviewer
    tasks: [security]
    agent: security-reviewer
    timeout_sec: 600         # small: 600 / medium: 1800 / large: 9000
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

### Step 5-8: Approval flow

Follow Steps 5-8 of `.claude/skills/agents/parent-workflow-common.md` with the following variables:

- `{report_baseName}`: `plan-report`
- `{approval_category}`: `plan`
- `{report_en_name}`: `work plan report`
- `{approval_target_en}`: `plan`

---

## Purpose
- Creating work plans based on requirements and architecture reports
- Assigning tasks to each agent
- Creating work plan reports (`plan-report-*.md`)

## Notes
- Does not edit or write to source files
- On first call, only reference `requirements-report` and `architecture-report` (test/review reports do not yet exist, so skip them)
- On update calls, reference all reports to reflect differences (follow the execution mode detection logic in the planner skill file)
