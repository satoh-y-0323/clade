# Reviewer Common Rules

## Pre-Work Checks (Common Steps)

Review the following in order before starting work (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand the design intent and interface specifications)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)

## Report Output Flow (Common)

### Standard size: single heredoc
```
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{full report content}
CLADE_REPORT_EOF
```
> **Syntax note**: Write `CLADE_REPORT_EOF` at the **start of the line (no indentation)**. Do not include the terminator string as a standalone line in the content.

### Large reports: append mode for split output
If the report is too large to write in one heredoc, split it by section and append:
```
# Section 1 (create new → note the returned filename)
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{opening sections (header, summary, etc.)}
CLADE_REPORT_EOF
# → e.g.: [write-report] .claude/reports/code-review-report-20260401-143022.md

# Section 2+ (append, use the filename from above)
node .claude/hooks/write-report.js <baseName> append code-review-report-20260401-143022.md <<'CLADE_REPORT_EOF'
{next section}
CLADE_REPORT_EOF
```

### ⚠️ If Bash fails with a permission error (last resort)
**Never give up silently.** Delegate to the parent Claude instead:
1. Output the full report content inline.
2. End with this message:
   "Bash write failed. Please save the above content to `.claude/reports/<baseName>-{timestamp}.md` using the Write tool."
