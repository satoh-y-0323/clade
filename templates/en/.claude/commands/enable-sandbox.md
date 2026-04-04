# /enable-sandbox Command

A security command that sets `"sandbox": true` in `.claude/settings.json`.
Enables the Claude Code sandbox feature, which restricts Bash command execution to a sandboxed environment.

## Execution Steps
1. Run the following using the Bash tool:
   ```
   node .claude/hooks/enable-sandbox.js
   ```
2. Report the output to the user:
   - If successfully enabled: Say "Sandbox has been enabled. It will take effect after restarting Claude Code."
   - If already enabled: Say "Sandbox is already enabled."
   - If failed: Present the error content
