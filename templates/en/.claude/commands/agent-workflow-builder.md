# /agent-workflow-builder command

A meta-agent that interviews the user about their work and auto-generates a set of agents tailored to that workflow. The parent Claude handles Q&A and workflow design; the sub-agent handles file generation.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent only handles file generation (Phase 3 and beyond).

## Execution flow

### Step 1: Read upstream reports (resume check)

Search for `.claude/reports/workflow-report-*.md` using Glob:
- **If found**: Read the latest file and resume from Phase 3 (jump to Step 4)
- **If not found**: Start from Phase 1 (proceed to Step 2)

### Step 2: Q&A (Phase 1 and 2)

#### Phase 1: Interview

Output the following questions one by one as text and wait for the user's response (output one question at a time, then proceed after receiving the answer).

**Q1: Role / nature of work**

```
What kind of work do you do?
Briefly describe your role or main responsibilities.
(e.g., sales admin, marketer, HR specialist, project manager, etc.)
```

**Q2: Recurring tasks**

```
Please describe a task you repeat daily or weekly.
A concrete task like "every Monday, tally sales and email the manager" is ideal.
If there are several, choose the one you most want to automate.
```

**Q3: Input (starting point of the task)**

```
What does this task start from? Please describe its "input."
(e.g., an Excel file, an incoming email, a Slack notification, a customer request, etc.)
```

**Q4: Output (end point of the task)**

```
When the task is complete, what is the "deliverable" you hand off?
(e.g., send a report by email, update a spreadsheet, save materials, etc.)
```

**Q5: The hardest step**

```
Within this task, which part takes the most time or feels the hardest?
(e.g., gathering and summarizing information, drafting text, review / checking, etc.)
```

**Q6: Confirmation / approval checkpoints (optional)**

```
Are there any points where you need confirmation or approval from someone?
(e.g., have a manager review the content before sending, share with the team for feedback, etc.)
If there are none, answer "none."
```

#### Phase 2: Workflow design and confirmation loop

Based on Phase 1 answers, design the workflow and present it to the user in the following format.
Repeat revision and re-presentation until "yes" is received:

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

**Step assignment criteria:**

| Situation | Role category | Example agent name |
|-----------|--------------|-------------------|
| Needs information gathering / organization | `gather` | agent-gatherer |
| Needs generation of text / documents / data | `create` | agent-creator |
| Needs content review / quality check | `check` | agent-checker |
| Needs an approval flow or final polish | `finalize` | agent-finalizer |
| Needs sending / sharing externally | `distribute` | agent-distributor |

**Target step count**: 2–5 steps (2–3 for simple work, 4–5 for complex work)

Make agent names match the user's domain (prefer concrete names over generic ones).

### Step 3: Organize Q&A results

Organize Phase 1 and 2 results into the following structure:
- Role / work content
- Recurring task content
- Input / output
- Hardest step
- Confirmation / approval timing
- Approved workflow (task name, agent names per step, role categories, what each does)
- Umbrella command name

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: workflow-builder` via the Agent tool. Include the following in the prompt:

```
## Work request
Generate agent files and update CLAUDE.md for the approved workflow

## workflow-report path (for resume only)
{file path or "none (new generation)"}

## Q&A results with user

### Phase 1: Interview
Q1 (role/work): {answer}
Q2 (recurring task): {answer}
Q3 (input): {answer}
Q4 (output): {answer}
Q5 (hardest step): {answer}
Q6 (confirmation/approval): {answer}

### Phase 2: Approved workflow
Task name: {task name}
Umbrella command name: {command name}

| Step | Agent name   | Role category | What it does |
|------|--------------|---------------|--------------|
| 1    | agent-{name} | {category}    | {what it does} |
| 2    | agent-{name} | {category}    | {what it does} |

## Output instructions
1. Save workflow-report to `.claude/reports/workflow-report-*.md` (via write-report.js)
2. For each step, generate the following 2 files as a set (Write tool allowed):
   - `.claude/commands/agent-{name}.md` (parent-Claude Q&A command file)
   - `.claude/agents/{name}.md` (sub-agent definition file)
3. Generate umbrella command at `.claude/commands/{workflow-name}.md` (Write tool allowed)
4. Append to `## User Agents` section in `CLAUDE.md` (Edit tool allowed)
5. The final message must include the list of generated files
- Do not use AskUserQuestion / SendMessage
- Exit after generating the files (reporting is handled by the parent Claude)
```

For regeneration after rejection, add the following to the prompt:
```
## Regeneration mode
- User's revision instructions: {instructions}
```

### Step 5: Receive results

Review the list of generated files from the sub-agent's final output.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The workflow builder has completed.

Generated files:
  - .claude/commands/agent-{name}.md x {N} (parent-Claude command files)
  - .claude/agents/{name}.md x {N} (sub-agent definition files)
  - .claude/commands/{workflow-name}.md (umbrella command)
  - CLAUDE.md updated

Usage:
  Running /{workflow-name} starts the {task name} flow automatically.

If revisions are needed, please let me know.
If everything looks good, answer "ok".
```

### Step 7: Record approval

Since workflow-builder does not generate a fixed report file, recording approval is omitted.

### Step 8: Restart on rejection

If revisions are needed, repeat from Step 4 with a new prompt that includes the revision instructions.

---

## Purpose
- Auto-generating custom agent sets from business workflow interviews
- Defining recurring tasks as Clade agents

## Notes
- Operates independently from the standard workflow (phases)
- This command is self-contained (no handoff to other agents)
- Generated agent templates should follow the new pattern (parent-child separation, single-shot launch)
