# /clear-file-history Command

A security command that deletes all contents of the `.claude/file-history/` folder.
Manually clears the backups that Claude Code automatically generates when editing files.

## Execution Steps
1. Run the following using the Bash tool:
   ```
   node .claude/hooks/clear-file-history.js
   ```
2. Report the output to the user:
   - Display the number of deleted items
   - If the folder does not exist, report that accordingly
