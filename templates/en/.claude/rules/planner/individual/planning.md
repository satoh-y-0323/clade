# Planning Rules

## Report Output and Approval Flow
1. Read all reports and build the task list
2. Output the plan report using the Bash tool (the actual file path is returned):
   ```
   # New output (first call)
   node .claude/hooks/write-report.js plan-report new "{first half of report content}"
   → Output example: [write-report] .claude/reports/plan-report-20260401-143022.md

   # Append output (repeat until all content is written for long reports)
   node .claude/hooks/write-report.js plan-report append plan-report-20260401-143022.md "{continued content}"
   → Output example: [write-report] .claude/reports/plan-report-20260401-143022.md (appended)
   ```
   **Note**: Due to command-line argument length limits (~8,000 characters), split long reports
   into 3,000–4,000 character chunks and output using `new` → `append` → `append`... order.

3. Note the output file path.

4. Present the report content to the user and request approval:
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
