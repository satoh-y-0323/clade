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

> **Syntax note**: Write `CLADE_REPORT_EOF` at the **start of the line (no indentation)**.
> If `CLADE_REPORT_EOF` appears alone on a line within the content, the heredoc terminates early — do not include the terminator string in the content.
> Since `<<'CLADE_REPORT_EOF'` uses single quotes, special characters (`` ` ``, `$`, `'`, etc.) in the content are treated literally and require no escaping.
