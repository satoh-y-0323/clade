# /agent-workflow-builder command

A meta-agent that interviews the user about their work and auto-generates a set of agents tailored to it.
A recursive structure: "use Clade to create Clade agents."

## Overview

Runs in 4 phases:
1. **Phase 1: Interview** — Ask 5–6 questions about the work, recurring tasks, and IN/OUT
2. **Phase 2: Workflow design** — Propose an agent for each step and confirm with the user
3. **Phase 3: Agent file generation** — Generate a `.md` file for each step
4. **Phase 4: Update CLAUDE.md** — Append to the `## User Agents` section

---

## Decision at startup

First, use the Glob tool to search `.claude/reports/workflow-report-*.md`:

- **If a file exists**: Read the latest file and resume from Phase 3.
- **If no file exists**: Start from Phase 1.

---

## Phase 1: Interview

Ask the following questions **one at a time, in order** via the AskUserQuestion tool (do not ask them all at once).

### Q1: Role / nature of work

```
What kind of work do you do?
Briefly describe your role or main responsibilities.
(e.g., sales admin, marketer, HR specialist, project manager, etc.)
```

### Q2: Recurring tasks

```
Please describe a task you repeat daily or weekly.
A concrete task like "every Monday, tally sales and email the manager" is ideal.
If there are several, choose the one you most want to automate.
```

### Q3: Input (starting point of the task)

```
What does this task start from? Please describe its "input."
(e.g., an Excel file, an incoming email, a Slack notification, a customer request, etc.)
```

### Q4: Output (end point of the task)

```
When the task is complete, what is the "deliverable" you hand off?
(e.g., send a report by email, update a spreadsheet, save materials, etc.)
```

### Q5: The hardest step

```
Within this task, which part takes the most time or feels the hardest?
(e.g., gathering and summarizing information, drafting text, review / checking, etc.)
```

### Q6: Confirmation / approval checkpoints (optional)

```
Are there any points where you need confirmation or approval from someone?
(e.g., have a manager review the content before sending, share with the team for feedback, etc.)
If there are none, answer "none."
```

---

## Phase 2: Workflow design

Based on the Phase 1 answers, design the workflow using the procedure below.

### Criteria for assigning steps

Analyze the interview content and decide the steps, using the following as a reference:

| Situation | Role category | Example agent name |
|-----------|--------------|-------------------|
| Needs information gathering / organization | `gather` | agent-gatherer |
| Needs generation of text / documents / data | `create` | agent-creator |
| Needs content review / quality check | `check` | agent-checker |
| Needs an approval flow or final polish | `finalize` | agent-finalizer |
| Needs sending / sharing externally | `distribute` | agent-distributor |

**Target step count**: 2–5 steps (2–3 for simple work, 4–5 for complex work)

Make agent names match the user's domain:
- If the work is "sales report," use names like `agent-sales-gatherer`, `agent-report-creator`
- Prefer concrete names that describe the work over generic ones

### Workflow proposal and confirmation loop

Use the AskUserQuestion tool to propose a workflow and iterate until the user answers "yes":

```
Based on your answers, here is the proposed workflow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task name: {task name (e.g., Weekly Sales Report Workflow)}

  Step 1. [gather]   agent-{name}  → {what this step does}
  Step 2. [create]   agent-{name}  → {what this step does}
  Step 3. [check]    agent-{name}  → {what this step does}
  ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Is this workflow correct?
Let me know if you'd like any adjustments. (e.g., "Step 3 isn't needed," "merge Steps 2 and 3")
Answer "yes" if it looks good.
```

If the user requests changes, update the workflow and present it again.

---

## Phase 3: Agent file generation

Generate a `.md` file for each step of the approved workflow.

### Files to generate

1. **Agent instruction files for each step** — `.claude/commands/agent-{name}.md` (one per step)
2. **Umbrella command** — `.claude/commands/{workflow-name}.md`

### Template for agent instruction files

Base them on the existing `interviewer` (interview structure), `code-reviewer` (review / finding structure), and `developer` (deliverable-generating structure) files, replacing only the role name and checklist:

```markdown
# /agent-{name} command

{Role description (1–2 sentences)}

## Role
- **Input**: {hand-off content from the previous Step}
- **Output**: {deliverable passed to the next Step}

## Work steps

1. {step 1}
2. {step 2}
3. {step 3}

## Completion criteria
- {check item 1}
- {check item 2}

## Notes
- {note 1}
```

### Template for the umbrella command

```markdown
# /{workflow-name} command

A workflow that automates {task name}.
Invokes each agent in order to complete the whole task.

## Execution order

1. `/agent-{step1-name}` — {description of Step 1}
2. `/agent-{step2-name}` — {description of Step 2}
...

## Usage

Running `/{workflow-name}` launches the agents in the order above.
The flow waits for confirmation after each Step.
```

Create each file with the Write tool. When generation is complete, report the list of created files to the user.

---

## Phase 4: Update CLAUDE.md

Append the generated agents to the `## User Agents` section of `CLAUDE.md`.

> **Note**: The `## Available Agents` section lives inside `<!-- CLADE:START -->` – `<!-- CLADE:END -->` and
> is overwritten when `/update` runs. Always append user-generated agents under `## User Agents`.

### Append format

```markdown
### {task name} workflow (auto-generated)
- `/{workflow-name}`              → Umbrella command that runs the {task name} workflow
- `/agent-{step1-name}`           → {Step 1 role}
- `/agent-{step2-name}`           → {Step 2 role}
```

Use the Edit tool to insert the text into `CLAUDE.md`, right after the
`<!-- Automatically appended by /agent-workflow-builder -->` comment in the `## User Agents` section.

---

## Completion report

After all phases are complete, tell the user:

```
✅ Workflow builder finished!

Generated files:
  - .claude/commands/agent-{name}.md × {N}
  - .claude/commands/{workflow-name}.md (umbrella command)
  - CLAUDE.md updated

Usage:
  Running /{workflow-name} starts the {task name} flow automatically.

Next steps:
  Open each agent instruction file (.claude/commands/agent-{name}.md)
  and fine-tune "Work steps" and "Completion criteria" to fit your work —
  this makes the agents noticeably more accurate.
```

---

## Workflow design report output (end of Phase 2)

Once Phase 2 is approved, write the following report to prepare for Phase 3:

```bash
node .claude/hooks/write-report.js workflow-report new <<'REPORT'
# Workflow Design Report

## Task name
{task name}

## Interview results
- Role / work: {answer to Q1}
- Recurring tasks: {answer to Q2}
- Input: {answer to Q3}
- Output: {answer to Q4}
- Hardest step: {answer to Q5}
- Confirmation / approval: {answer to Q6}

## Approved workflow

| Step | Agent name   | Role category | What it does |
|------|--------------|---------------|--------------|
| 1    | agent-{name} | {category}    | {what it does} |
| 2    | agent-{name} | {category}    | {what it does} |

## Umbrella command name
/{workflow-name}
REPORT
```

After writing the report, proceed directly to Phase 3 (no user confirmation needed).
