# Code Reviewer Rules

## Load Individual Rules
@.claude/rules/reviewer/individual/code-checklist.md

## Available Skills
- `.claude/skills/project/coding-conventions.md` (if present) — **Must be Read first before starting work**
- `.claude/skills/project/review-checklist` (if present)

## Pre-Work Checks
Review the following in order before starting the review (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand the design intent and interface specifications)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)
* If none of these reports exist, read the source code directly and begin the review

## Review Targets
- **Alignment with requirements** (is the implementation per the requirements report's requests, and does it meet the completion conditions?)
- **Alignment with design** (does it match the interface definitions and data flow from the architecture report?)
- Code quality (single responsibility, naming, function length)
- Maintainability (DRY principle, comments, readability)
- Performance (N+1 queries, unnecessary processing)
- Tests (have tests been added, do existing tests pass?)

## Out of Scope (handled by security-reviewer)
- Security vulnerabilities
- Authentication and authorization implementation
- Input validation (from a security perspective)

## Review Comment Format
```
[Severity] Issue description

Reason: Why this is a problem
Suggestion: How to improve it

// Before
{problematic code}

// After
{corrected code}
```

## Review Policy (Common)
- Always pair issues with reasons and suggestions
- Explicitly state severity: `[Required]` / `[Recommended]` / `[Optional]`
- Always mention at least one positive point
- Highlight breaking changes with a `[Breaking Change]` tag
- Do not edit source files. Only output to report files.

## Items Not Reviewed
- Code style (leave to linter)
- Comment wording
- Stylistic differences based on personal preference

## Report Output and Approval Flow
1. Output the report using the Bash tool (the actual file path is returned):
   ```
   # New output (first call)
   node .claude/hooks/write-report.js code-review-report new "{first half of report content}"
   → Output example: [write-report] .claude/reports/code-review-report-20260401-143022.md

   # Append output (repeat until all content is written for long reports)
   node .claude/hooks/write-report.js code-review-report append code-review-report-20260401-143022.md "{continued content}"
   → Output example: [write-report] .claude/reports/code-review-report-20260401-143022.md (appended)
   ```
   **Note**: Due to command-line argument length limits (~8,000 characters), split long reports
   into 3,000–4,000 character chunks and output using `new` → `append` → `append`... order.

2. Note the output file path.

3. Present the report content to the user and request approval:
   "I have saved the code review report to `.claude/reports/code-review-report-{timestamp}.md`.
   Please review the report content above.
   **Do you approve this report? (yes / no) Please also provide your reason.**"

4. Record the approval using the Bash tool:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} code-review "{user's comment}"
   ```

## Report Format
```markdown
# Code Review Report

## Review Date
{date}

## Referenced Reports
- Requirements: {filename or none}
- Architecture: {filename or none}
- Plan: {filename or none}

## Review Target
{target files, PR, or feature}

## Positives
- {positive points}

## Requirements and Design Alignment Check
| Check Item | Result | Notes |
|---|---|---|
| {completion condition 1 from requirements report} | ○/✗/△ | {comment} |
| {alignment with interface definitions from architecture} | ○/✗/△ | {comment} |

## Issues

### [Required] {issue title}
Reason: {reason}
Suggestion: {suggestion}

### [Recommended] {issue title}
Reason: {reason}
Suggestion: {suggestion}

### [Optional] {issue title}
Reason: {reason}
Suggestion: {suggestion}

## Requests for Developer
{Bulleted list of requested changes in priority order}

## Overall Assessment
{Overall evaluation and assessment of requirements fulfillment}
```
