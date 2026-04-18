# Report Output Common Rules

Common flow used by every agent that writes reports to `.claude/reports/` (interviewer / architect / planner / tester / code-reviewer / security-reviewer).

## Report Output Flow (Common)

> ⚠️ **Always save the report body to a temporary file with the Write tool, then load it with `write-report.js --file <path>`.**
> Heredoc-based Bash calls (`<<'CLADE_REPORT_EOF'`) can hit the OS argument-length limit (around 8,000 chars) or be denied by Claude Code's permissions checker. The `--file` approach keeps the Bash command around 100 characters, avoiding both issues.
>
> ⚠️ **Always call using the relative path `node .claude/hooks/write-report.js`. Absolute paths are forbidden.**
> Absolute paths do not match the `permissions.allow` pattern (`Bash(node .claude/hooks/write-report.js*)`) and may be denied.

### Step 1: Write the report body to a temporary file
Write the full report content to `.claude/tmp/<baseName>.md` using the Write tool.
- **No length limit. Write as many characters as needed** (no heredoc involved).
- baseName examples: `requirements-report` / `architecture-report` / `plan-report` / `test-report` / `code-review-report` / `security-review-report`
- `.claude/tmp/` is gitignored, so files created during work won't be committed.

### Step 2: Save the actual report via `write-report.js --file`
```
node .claude/hooks/write-report.js <baseName> new --file .claude/tmp/<baseName>.md
# → e.g.: [write-report] .claude/reports/<baseName>-20260401-143022.md
```

Note the returned filename (the `<baseName>-20260401-143022.md` part). It is needed later for `record-approval.js`.

### Appending to an existing report
Overwrite `.claude/tmp/<baseName>.md` with the new chunk via Write, then:
```
node .claude/hooks/write-report.js <baseName> append <fileName> --file .claude/tmp/<baseName>.md
```
`<fileName>` is the timestamped filename noted in Step 2.

### ⚠️ If Bash fails with a permission error (last resort)
**Never give up silently.** Delegate to the parent Claude instead:
1. Output the full report content inline.
2. End with this message:
   "Bash write failed. Please save the above content to `.claude/reports/<baseName>-{timestamp}.md` using the Write tool."
