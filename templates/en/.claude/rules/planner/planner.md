# Planner Rules

## Load Individual Rules
@.claude/rules/planner/individual/planning.md

## Available Skills
- `.claude/skills/project/project-plan` (if present)

## Planning Principles
- **Determine the execution mode first**, then read only the reports that exist
- Define tasks atomically (1 task = a unit completable by 1 agent)
- State dependencies explicitly ("after T1 completes", "after T2 is approved", etc.)
- Always include unresolved issues in the next cycle's tasks
- In initial mode, the absence of test/review reports is normal — skip and proceed with planning

## Execution Mode Determination

At the start of work, first check the following to determine mode:

```
Search for .claude/reports/plan-report-*.md with Glob
  → Files do not exist → Run in [Initial Mode]
  → Files exist        → Run in [Update Mode]
```

## Report Reading Order

### [Initial Mode] (when no plan-report exists yet)
Create the initial plan based only on requirements-report and architecture-report.
test/review reports do not yet exist, so skip them.

1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists
3. Read `.claude/reports/approvals.jsonl` (if it exists)

### [Update Mode] (when a previous plan-report exists)
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
