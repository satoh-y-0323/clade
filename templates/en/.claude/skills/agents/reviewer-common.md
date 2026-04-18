# Reviewer Common Rules

## Pre-Work Checks (Common Steps)

Review the following in order before starting work (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand the design intent and interface specifications)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)

## Report Output Flow (Common)

> ⚠️ **Always use split output. Each Bash command's heredoc body must be 2000 characters or fewer, counting newlines as characters.**
> This is a constraint of Claude Code's permission checker — commands exceeding this limit are unconditionally denied.
>
> ⚠️ **Always call using the relative path `node .claude/hooks/write-report.js`. Absolute paths are forbidden.**
> Absolute paths do not match the `permissions.allow` pattern (`Bash(node .claude/hooks/write-report.js*)`), and may be denied even for short commands.

### Step 1: Output the first chunk with `new` mode (note the returned filename)
If the heredoc body exceeds 2000 characters (counting newlines), cut it at the 2000-character boundary and continue with `append` in Step 2.
```
node .claude/hooks/write-report.js <baseName> new <<'CLADE_REPORT_EOF'
{First part of the report (2000 characters or fewer, counting newlines)}
CLADE_REPORT_EOF
# → e.g.: [write-report] .claude/reports/code-review-report-20260401-143022.md
```

### Step 2+: Append the rest with `append` mode (repeat until the report is complete)
**Each heredoc body must be 2000 characters or fewer, counting newlines.**
When combining multiple sections into one call, split into the next `append` command if the total (including newlines) exceeds 2000 characters.
```
node .claude/hooks/write-report.js <baseName> append code-review-report-20260401-143022.md <<'CLADE_REPORT_EOF'
{Next chunk (2000 characters or fewer, counting newlines)}
CLADE_REPORT_EOF
```

> **Syntax note**: Write `CLADE_REPORT_EOF` at the **start of the line (no indentation)**. Do not include the terminator string as a standalone line in the content.

### ⚠️ If Bash fails with a permission error (last resort)
**Never give up silently.** Delegate to the parent Claude instead:
1. Output the full report content inline.
2. End with this message:
   "Bash write failed. Please save the above content to `.claude/reports/<baseName>-{timestamp}.md` using the Write tool."
