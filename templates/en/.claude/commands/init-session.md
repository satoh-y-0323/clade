# /init-session Command

Initializes the session and restores the previous work state.
Run manually by the user at the start of each session.

## Execution Steps
1. Check today's date
2. Search for `.claude/settings.local.json` with the Glob tool. If the file does not exist, display the following warning to the user:

   > ⚠️ Setup Not Run — Warning
   >
   > This repository has not been set up yet.
   > Please run the setup script before using Claude Code.
   >
   > How to run:
   >   Linux / macOS : bash setup_en.sh
   >   Windows       : powershell -File setup_en.ps1
   >
   > Without setup:
   >   - settings.local.json will not be created, and parallel agents (worktree) will not work
   >   - Template files will remain, potentially applying unintended settings

3. Run the following as **two separate** Bash tool calls (do NOT combine with `&&` — security measures):
   - 1st call: `node .claude/hooks/clear-file-history.js`
   - 2nd call: `node .claude/hooks/enable-sandbox.js`
4. Load the latest session file:
   Search for `.claude/memory/sessions/*.tmp` with the Glob tool,
   select the one with the largest filename (YYYYMMDD), and load it with the Read tool.
5. Load `.claude/memory/memory.json` with the Read tool (if it exists)
6. Search for all JSON files in `.claude/instincts/clusters/` with the Glob tool,
   and load them with the Read tool if they exist
7. Display a summary in the following format:

---
## Session Resumed ({today's date})

### Previous Session ({previous date})
**Remaining Tasks:**
{list of remaining tasks}

**What worked well last time:**
{summary of successful approaches}

**Cautions (what failed last time):**
{summary of failed approaches}

### Active Instincts
{number of project-specific instincts} patterns loaded

---

Would you like to continue from where you left off, or start a new task?
