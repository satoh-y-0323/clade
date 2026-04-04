# /cluster-promote Command

Clusters observation data (instincts) and promotes them to project-specific skills or rules.

## Execution Steps
1. Load the following files:
   - Load `.claude/instincts/raw/observations.jsonl` with the Read tool
   - Search for `.claude/instincts/raw/patterns_*.json` with the Glob tool and load all with the Read tool

2. Classify patterns based on the following criteria:

   **Skill candidates** (things that can be reused as procedures):
   - Patterns with 3 or more successes with the same tool in the same context
   - A series of steps that resolved a specific problem

   **Rule candidates** (constraints to follow or things to avoid):
   - Patterns where a different approach succeeded after 2 or more failures
   - Patterns where a specific operation consistently causes errors

3. Present the candidate list to the user:
   ```
   ## Promotion Candidates

   ### Skill Candidates
   1. {pattern name}: {description} (occurrences: {N})
   2. ...

   ### Rule Candidates
   1. {pattern name}: {description} (failures: {N} → successful pattern found)
   2. ...

   Please select items to promote by number (e.g., 1,3) or "all" for all
   ```

4. Save approved items:
   - Skills → Save to `.claude/skills/project/{name}.md` with the Write tool
   - Rules → Save to `.claude/rules/{role}/individual/{name}.md` with the Write tool
   - Cluster info → Save to `.claude/instincts/clusters/{YYYYMMDD}-{name}.json` with the Write tool

5. Archive processed observation data:
   Read the contents of `.claude/instincts/raw/observations.jsonl` with the Read tool,
   write them to `.claude/instincts/raw/observations_{YYYYMMDD}_archived.jsonl` with the Write tool.
   Then empty the original file ("") with the Write tool.
   * Do not use shell commands (for cross-platform compatibility)
