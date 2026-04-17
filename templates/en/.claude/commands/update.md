# /update command

Update the clade framework to the latest version.

## Steps

### Step 1: Check for updates

Run with the Bash tool:

```bash
node .claude/hooks/clade-update.js --check
```

Output is JSON format. Parse and branch as follows:

#### No update available (`has_update: false`)

Tell the user: "clade is already at the latest version (`{current_version}`)." and exit.

#### Network error or other failure

Tell the user the error message and exit.

### Step 2: Display changes

If `has_update: true`, present the following to the user:

```
## clade Update Available

Current version: {current_version}
Latest version:  {latest_version}

### Changelog
{changelog}

### File changes (Japanese)
Added:   {ja.added list, or "(none)"}
Updated: {ja.updated list, or "(none)"}
Removed: {ja.removed list, or "(none)"}

### File changes (English template)
Added:   {en.added list, or "(none)"}
Updated: {en.updated list, or "(none)"}
Removed: {en.removed list, or "(none)"}
```

(If all of added, updated, and removed lists are empty, omit the "File changes" sections.)

### Step 3: Confirm update

Ask the user:

```
Do you want to apply the update?
  [yes] Apply the update (current state will be backed up as a commit first)
  [no]  Cancel the update
```

- **no**: Tell the user "Update cancelled." and exit.

### Step 4: Apply update

**yes**: Run with the Bash tool:

```bash
node .claude/hooks/clade-update.js --apply
```

- **Success**:
  1. The last line of stdout is JSON. Parse it and read the `interactive_diffs` array.
  2. If `interactive_diffs` is empty or absent, tell the user "clade has been updated to `{latest_version}`." and finish.
  3. If `interactive_diffs` has one or more entries, proceed to Step 5.
- **Success but stderr contains `{"marker_missing":true}`**: Notify the user:
  "No CLADE markers were found in CLAUDE.md. The CLADE-managed section was not updated.
  Please manually add `<!-- CLADE:START -->` / `<!-- CLADE:END -->` markers."
- **Failure**: Show the error message and offer:

```
An error occurred during the update. Do you want to roll back?
  [yes] Roll back to the state before the update
  [no]  Leave as is
```

### Step 5: Interactive diff loop

Process each entry in the apply stdout's `interactive_diffs` array in order.
Each entry has the following fields:

- `target`: Path of the file to be updated
- `new`: Path of the staged `.new` file (or `null` when there is no diff)
- `isNew`: `true` when the target file was newly placed (no existing user file)

For each entry:

1. **If `new` is `null` or `isNew === true`**: Tell the user "`{target}` was placed as a new file." and move to the next entry.
2. **If `new` is non-null**:
   1. Use the Bash tool to display the diff:
      ```bash
      git diff --no-index --color=never "<target>" "<new>"
      ```
      Note: git returns exit code 1 when there are diffs. This is not an error — display the stdout contents.
   2. Ask the user:
      ```
      {target} has changes. Overwrite with the contents of {new}?
        [yes] Overwrite (the .new file will be deleted)
        [no]  Do not overwrite (the .new file will remain; please merge it manually)
      ```
   3. **yes**: Run with the Bash tool:
      ```bash
      node .claude/hooks/apply-diff.js --target "<target>" --new "<new>"
      ```
      Tell the user "`{target}` was overwritten."
   4. **no**: Tell the user "`{new}` has been kept. Please review its contents and merge them into `{target}` manually."

Once all entries have been processed, tell the user "clade has been updated to `{latest_version}`." and finish.

### Step 6: Rollback (on error only)

If rollback is selected, run with the Bash tool:

```bash
node .claude/hooks/clade-update.js --rollback
```

- **Success**: Tell the user "Rolled back to the state before the update."
- **Failure**: Tell the user the error message.

## Notes

- The current state is automatically backed up as a git commit before updating
- Files you added to `.claude/` will not be overwritten (only files registered in clade-manifest.json are updated)
- The user-written section of CLAUDE.md (after `<!-- CLADE:END -->`) will not be modified
- `settings.json` / `settings.local.json` may contain user-specific customizations, so diffs are confirmed interactively (Step 5)
- `memory/memory.json` is never overwritten once it exists, to preserve your accumulated data
