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

---

## Report Reading Rules (Common)

When agents read past reports from `.claude/reports/`, follow these rules.
Report files accumulate as historical records, so judge by **timestamp ("current cycle")**, not by mere presence.

### Definition of "Current Cycle"
**Current cycle** = reports created on or after the timestamp T_plan of the latest plan-report.
test/review reports older than T_plan are leftovers from previous cycles and must not be referenced.

### Upstream Reports (Read the latest)
- `requirements-report-*.md`
- `architecture-report-*.md`
- `plan-report-*.md`

These are either older than the plan-report or the plan-report itself. Just glob and read the latest.

### Downstream Reports (Read the latest among those after T_plan)
- `test-report-*.md`
- `code-review-report-*.md`
- `security-review-report-*.md`

Reference only those produced "in the current cycle". Procedure:

```
Step 1. Glob for .claude/reports/plan-report-*.md → take the latest timestamp as T_plan
        If no plan-report exists → treat downstream reports as "not yet produced this cycle"

Step 2. Glob for the target report (e.g., test-report-*.md)
        Filter to those whose filename timestamp (YYYYMMDD-HHmmss) is newer than T_plan

Step 3. Read the latest from the filtered list
        If the filtered list is empty, treat as "not produced in the current cycle"
```

### Per-Agent Reference Targets

| Agent | Upstream (latest) | Downstream (latest after T_plan) |
|---|---|---|
| planner (Initial Mode) | requirements + architecture | — |
| planner (Update Mode) | requirements + architecture + plan | test + code-review + security-review |
| tester | requirements + architecture + plan | — |
| developer | requirements + architecture + plan | test + code-review + security-review |
| code-reviewer | requirements + architecture + plan | — |
| security-reviewer | requirements + architecture + plan | — |

`approvals.jsonl` is read in full (no filter — it is an append-only log).
