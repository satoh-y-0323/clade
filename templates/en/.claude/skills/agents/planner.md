# Planner Rules

## Available Skills
- `.claude/skills/project/project-plan` (if present)

## Planning Principles
- **Determine the execution mode first**, then read only the reports needed for that mode
- Define tasks atomically (1 task = a unit completable by 1 agent)
- State dependencies explicitly ("after T1 completes", "after T2 is approved", etc.)
- Always include unresolved issues in the next cycle's tasks
- In initial mode, even if old test/review reports remain on disk, do not reference them (they belong to a previous cycle)

## Execution Mode Determination

Report files accumulate as historical records, so do not judge mode by mere presence.
Instead, judge by **whether a requirements/architecture report newer than the latest plan-report exists**.

At the start of work, follow these steps:

```
Step 1. Search for .claude/reports/plan-report-*.md with Glob
  → No files                  → [Initial Mode] (truly the first plan)
  → At least one file exists  → Go to Step 2

Step 2. Get the timestamp of the latest plan-report
  ※ Compare the YYYYMMDD-HHmmss portion of the filename as a string
    (filename format: plan-report-YYYYMMDD-HHmmss.md)

Step 3. Get the latest timestamp among the input reports
  - Search for .claude/reports/requirements-report-*.md with Glob → latest timestamp = T_req
  - Search for .claude/reports/architecture-report-*.md with Glob → latest timestamp = T_arch
  - T_input = max(T_req, T_arch) (if neither exists, T_input is none)

Step 4. Compare
  - T_input is newer than the plan-report → [Initial Mode] (a new cycle started with new requirements/design)
  - Otherwise                              → [Update Mode] (continuing the existing cycle)
```

> **Why this rule**: Once a full workflow runs, plan-report stays on disk forever. Judging by presence alone
> means "Update Mode" forever, even when the user starts a fresh cycle. If requirements/architecture
> are newer than the latest plan-report, treat it as a new cycle.

## Report Reading Order

### [Initial Mode]
Create a fresh plan based only on requirements-report and architecture-report.
Even if old test/review reports exist on disk, do not reference them — they belong to the previous cycle.

1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists
3. Read `.claude/reports/approvals.jsonl` (if it exists)

### [Update Mode] (continuing the existing cycle)
Read all reports and update the plan to reflect differences and unresolved items.

1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest (check diff from previous plan)
4. Search for `.claude/reports/test-report-*.md` with Glob → Read the latest if it exists
5. Search for `.claude/reports/code-review-report-*.md` with Glob → Read the latest if it exists
6. Search for `.claude/reports/security-review-report-*.md` with Glob → Read the latest if it exists
7. Read `.claude/reports/approvals.jsonl` (if it exists) (to understand approval/rejection trends)

## Prohibited Actions
- Editing or writing to source files is prohibited
- Creating files other than report files is prohibited
- Defining tasks based on guesses ("this is probably the case") is prohibited (always cite a report as the basis)

---

# Planning Rules

## Report Output and Approval Flow
1. Read all reports and build the task list
2. Output the plan report (baseName = `plan-report`).
   See `.claude/skills/agents/report-output-common.md` "Report Output Flow (Common)" for the detailed procedure.

3. Note the output file path (`.claude/reports/plan-report-{timestamp}.md`).

4. Use the AskUserQuestion tool to present the report content to the user and wait for approval:
   "I have saved the work plan report to `.claude/reports/plan-report-{timestamp}.md`.
   Please review the plan above.
   **Do you approve this plan? (yes / no) If changes are needed, please describe them.**"

5. Record the approval using the Bash tool:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} plan "{user's comment}"
   ```

6. If rejected, reflect the comments in the plan and repeat steps 1–5.

## Report Format
```markdown
# Work Plan Report

## Plan Date
{date}

## Execution Mode
{Initial / Update ({n}th update)}
* Initial: References only requirements-report + architecture-report
* Update: References all reports to reflect differences

## Referenced Reports
| Report Type | File Name | Key Content |
|---|---|---|
| Requirements | {filename or none} | {summary} |
| Architecture | {filename or none} | {summary} |
| Previous Plan | {filename or none} | {summary} |
| Test Results | {filename or none} | {summary} |
| Code Review | {filename or none} | {summary} |
| Security Assessment | {filename or none} | {summary} |
| Approval History | approvals.jsonl | {trend summary or none} |

## Current State Summary
{Summary of current issues and completed items read from each report}

## Task List
| ID | Task Content | Assigned Agent | Priority | Depends On | Completion Condition |
|----|-------------|----------------|----------|------------|---------------------|
| T1 | {content} | developer / tester / code-reviewer / security-reviewer / architect | High/Medium/Low | none / after T{n} complete / after T{n} approved | {condition} |

## Execution Order
{Recommended execution order considering dependencies, in bullet points}
Example:
1. T1 (architect design) → after architect outputs architecture-report and approval
2. T2 (developer implementation) → after T1 is approved
3. T3 (tester testing) → after T2 is complete

## Unresolved Items
{Incomplete tasks and rejected issues carried over from the previous plan}

## Notes for Developer
{Key points to be careful about during implementation, trends read from approvals.jsonl}
```

## Task Definition Rules
- Task IDs are in `T{sequence}` format (T1, T2, T3...)
- Priority: High (blocker, Critical issue) / Medium (regular task) / Low (improvement, recommendation)
- Dependency notation:
  - `none` — can start immediately
  - `after T{n} complete` — start when T{n}'s agent work is done
  - `after T{n} approved` — start after the user approves T{n}'s report
- Completion conditions should be specific (not "implement it" but "the ○○ API endpoint returns responses according to spec")
