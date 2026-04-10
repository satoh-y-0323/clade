# Planner Rules

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

---

# Planning Rules

## Report Output and Approval Flow
1. Read all reports and build the task list
2. Output the plan report using the Bash tool (the actual file path is returned):
   ```
   node .claude/hooks/write-report.js plan-report new <<'CLADE_REPORT_EOF'
   {full report content}
   CLADE_REPORT_EOF
   → Output example: [write-report] .claude/reports/plan-report-20260401-143022.md
   ```

3. Note the output file path.

4. Use the AskUserQuestion tool to present the report content to the user and wait for approval:
   "I have saved the work plan report to `.claude/reports/plan-report-{timestamp}.md`.
   Please review the plan above.
   **Do you approve this plan? (yes / no) If changes are needed, please describe them.**"

5. Record the approval using the Bash tool:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} plan "{user's comment}"
   ```

6. If rejected, reflect the comments in the plan and repeat steps 1–5.

## Parallel Development Mode Determination

After building the task list, use **parallel development mode** and define `parallel_groups` in the plan-report if all of the following conditions are met:

1. There are 2 or more independent task groups (no dependencies between groups)
2. The files each group handles can be clearly separated
3. Shared interfaces and type definitions can be finalized in advance

If parallel development mode applies, output the following as a **YAML frontmatter** at the top of the plan-report:

```yaml
---
parallel_groups:
  group-a:
    name: {group name}
    tasks:
      - {task ID}
    files:
      - {file pattern (e.g., src/user/**, src/types/user.ts)}
  group-b:
    name: {group name}
    tasks:
      - {task ID}
    files:
      - {file pattern}
pre_implementation:
  - {files that must be implemented and committed before parallel work begins (interfaces, type definitions, etc.)}
---
```

**File pattern syntax:**
- `src/user/**` — all files under `src/user/`
- `src/types/user.ts` — a specific file
- Patterns must not overlap between groups

Omit the YAML frontmatter if parallel development mode does not apply.

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
