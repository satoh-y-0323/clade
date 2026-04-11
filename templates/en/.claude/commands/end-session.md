# /end-session Command

Records the session's achievements, failures, and remaining tasks in a session file and saves it.

## Usage
```
/end-session              # Normal execution (with promotion candidate suggestions)
/end-session --no-promote # Skip Step 5 (promotion suggestions) and finish immediately
```

## Execution Steps
1. Determine the session file path for today:
   `.claude/memory/sessions/{YYYYMMDD}.tmp`
2. Reflect on the work done this session and generate content using the following template:

```
SESSION: {YYYYMMDD}
AGENT: {agent name used}
DURATION: {estimated work time}

## Approaches That Worked (with evidence)
- {approach name}: {specifically what was done}
  Evidence: {commit hash / file path / test result / command output}

## Approaches That Were Tried but Failed
- {approach name}: {reason for failure}
  Lesson: {what to avoid next time}

## Approaches Not Yet Tried
- {hypothesis}: {reason it's worth trying}

## Remaining Tasks
- [ ] {task 1} (priority: high)
- [ ] {task 2} (priority: medium)
- [ ] {task 3} (priority: low)
```

3. Write to the file:
   - **If the file does not exist**: Use the Write tool to write the full template as-is
   - **If the file already exists**: Read the existing content with the Read tool, then use the Edit tool to **append** to each section. Do not duplicate section headings — add new items to the end of the existing bullet list in each section.
     Example: If `## Approaches That Worked (with evidence)` already exists, add new approaches to the end of that section (do not create a second heading).

3.5. Write the JSON block:
   Serialize the session content using the schema below and append it to the end of the file.
   If a `<!-- CLADE:SESSION:JSON` block already exists, replace it with the Edit tool.

   ```
   <!-- CLADE:SESSION:JSON
   {
     "session": "{YYYYMMDD}",
     "successes": [
       { "title": "{approach name}", "summary": "{description}", "evidence": "{commit hash, etc.}" }
     ],
     "failures": [
       { "title": "{approach name}", "lesson": "{lesson learned}" }
     ],
     "todos": [
       { "done": false, "text": "{task description}", "priority": "{high|medium|low}" }
     ]
   }
   -->
   ```

   - `successes` / `failures` / `todos` contain the same content as the Markdown sections above, structured as JSON
   - If the `## Facts Log (auto-generated / stop.js)` section already exists, place this block **after** it
   - Completed tasks (`done: true`) may be omitted from the list

4. Report completion

## Notes
The session file is automatically loaded by the next `/init-session`.
Write remaining tasks specifically (not "implement it" but "implement the create method in UserService").

## Step 5: Present Promotion Candidates (Inline)

> **Note:** If invoked as `/end-session --no-promote`, skip this entire step and proceed directly to the completion report.

After saving the session file, do the following:

1. Read `.claude/memory/pending-promotions.json` (skip if it does not exist)
2. Run the following command to get today's candidates:
   ```
   node .claude/hooks/cluster-promote-core.js scan --since today --json
   ```
3. Merge the pending-promotions.json candidates with today's candidates
4. If there are 0 candidates, skip and proceed to the completion report
5. If candidates exist, use AskUserQuestion to present the following:
   "Promotion candidates were found from today's session.
   (Display the candidate list with numbers)
   Would you like to save them?
     [yes] Specify by number to save (e.g., 1,3) or 'all'
     [no]  Do not save (delete pending if it exists)
     [later] Re-present at the next /end-session"

6-a. If yes:
   - For each selected candidate:
     - Rule: Write to `.claude/rules/{name}.md` using the Write tool
     - Skill: Write to `.claude/skills/project/{name}.md` using the Write tool
     - For rules: run `node .claude/hooks/update-clade-section.js add-rule {name}`
   - Delete `.claude/memory/pending-promotions.json` (if it exists):
     ```
     Bash: rm .claude/memory/pending-promotions.json
     ```

6-b. If later:
   - Save unprocessed candidates to `.claude/memory/pending-promotions.json` using the Write tool
   - Schema: `{ "savedAt": "YYYY-MM-DD", "candidates": [...] }`

6-c. If no:
   - Delete `.claude/memory/pending-promotions.json` if it exists:
     ```
     Bash: rm .claude/memory/pending-promotions.json
     ```
   - Note: Use the Bash `rm` command for deletion
