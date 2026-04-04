# /init-session Command

Initializes the session and restores the previous work state.
Also runs automatically via the SessionStart hook, but can be called manually.

## Execution Steps
1. Check today's date
2. Run the following in order using the Bash tool (security measures):
   ```
   node .claude/hooks/clear-file-history.js
   node .claude/hooks/enable-sandbox.js
   ```
3. Load the latest session file:
   Search for `.claude/memory/sessions/*.tmp` with the Glob tool,
   select the one with the largest filename (YYYYMMDD), and load it with the Read tool.
4. Load `.claude/memory/memory.json` with the Read tool (if it exists)
5. Search for all JSON files in `.claude/instincts/clusters/` with the Glob tool,
   and load them with the Read tool if they exist
6. Display a summary in the following format:

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
