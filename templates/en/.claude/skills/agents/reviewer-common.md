# Reviewer Common Rules

## Pre-Work Checks (Common Steps)

Review the following in order before starting work (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand the design intent and interface specifications)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)

## Report Output Note

Use heredoc (`<<'CLADE_REPORT_EOF'`) to preserve newlines and bypass command-line argument length limits. Special characters such as single quotes and backticks are treated literally. No need to split the report content.

```
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{full report content}
CLADE_REPORT_EOF
```
