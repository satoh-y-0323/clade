# Reviewer Common Rules

## Pre-Work Checks (Common Steps)

Review the following in order before starting work (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand the design intent and interface specifications)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)

## Report Output Note

Use heredoc (`<<'REPORT'`) to preserve newlines and bypass command-line argument length limits. No need to split the report content.
