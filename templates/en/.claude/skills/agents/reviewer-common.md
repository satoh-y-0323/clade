# Reviewer Common Rules

## Pre-Work Checks (Common Steps)

Review the following in order before starting work (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand the design intent and interface specifications)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)

## Report Output Note

**Recommended: --file option** (eliminates all special character, newline, and length issues)

1. Save report content to a temp file using the Write tool (e.g., `/tmp/clade-report.md`)
2. Pass it to write-report.js via Bash:
   ```
   node .claude/hooks/write-report.js <baseName> new --file /tmp/clade-report.md
   ```
   → Output example: `[write-report] .claude/reports/<baseName>-20260401-143022.md`

Use a unique filename for the temp file (e.g., `/tmp/clade-report-{yyyymmdd}.md`) to avoid collisions.
