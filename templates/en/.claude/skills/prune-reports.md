# /prune-reports Skill

Clean up report files accumulated in `.claude/reports/`.
Keeps the N most recent files per report type and deletes older ones after user confirmation.

## Default Retention Counts

| Type | Keep |
|---|---|
| requirements-report | 3 |
| architecture-report | 3 |
| plan-report | 3 |
| test-report | 5 (higher because of TDD iteration cycles) |
| code-review-report | 3 |
| security-review-report | 3 |

## Steps

### Step 1: Collect Report Files

Use `Glob` to retrieve all `.claude/reports/*.md` files.

If no files are found, display "No report files found." and exit.

### Step 2: Group by Type

Determine the type from the filename prefix (the part before the timestamp).

Examples:
- `requirements-report-20260411-123456.md` → type: `requirements-report`
- `test-report-20260410-093000.md` → type: `test-report`

Files with unrecognized prefixes are likely user-created and are **excluded** from cleanup.

### Step 3: Determine Files to Delete

Sort each type's files in descending order by filename (newest first).
Files beyond the default retention count are marked for deletion.

### Step 4: Confirm with User

If there are no candidates for deletion, display "No cleanup needed (all types are within retention limits)." and exit.

If there are candidates, present them in the following format:

```
## /prune-reports Confirmation

The following reports will be deleted (keeping the N most recent per type):

### requirements-report (keep 3 → delete 1)
- requirements-report-20260401-100000.md

### test-report (keep 5 → delete 3)
- test-report-20260401-090000.md
- test-report-20260401-083000.md
- test-report-20260331-150000.md

Total: N file(s) will be deleted. Proceed?
  [yes] Delete
  [no]  Cancel
```

### Step 5: Execute Deletion

If yes: delete the candidate files using Bash.

```bash
rm .claude/reports/{filename}
```

After deletion, report "Deleted N report file(s)."

> **Note:** `.claude/reports/` is listed in `.gitignore`, so no commit is needed.
