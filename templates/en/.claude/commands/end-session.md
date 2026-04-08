# /end-session Command

Records the session's achievements, failures, and remaining tasks in a session file and saves it.

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
4. Report completion

## Notes
The session file is automatically loaded by the next `/init-session`.
Write remaining tasks specifically (not "implement it" but "implement the create method in UserService").
