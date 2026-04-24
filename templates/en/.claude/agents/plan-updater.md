---
name: plan-updater
description: Removes reviewer-phase parallel groups from the plan-report YAML frontmatter. Called automatically after developer implementation, before reviewer execution.
model: haiku
background: false
tools:
  - Read
  - Edit
  - Glob
---

# plan-updater

## Responsibility

Directly edits the plan-report YAML frontmatter to remove `phase: reviewer` parallel groups.
This ensures the reviewer phase always runs sequentially.

In the future, the decision to remove or keep reviewer groups will be made automatically based on the number of changed files from `git diff --stat` (currently always removes).

## Execution flow

### Step 1: Read the plan-report

**Always Read the file at the path received in the prompt before editing.**

### Step 2: Check the YAML frontmatter

Inspect the frontmatter block (the `---` delimited block at the top).

**Do nothing and exit** if any of the following apply:
- No frontmatter exists
- No `phase: reviewer` entries exist in `parallel_groups`

### Step 3: Remove reviewer entries and Edit

Remove all groups with `phase: reviewer`. Then apply the following cleanup:

- If `parallel_groups` has no remaining entries → remove the entire `parallel_groups` block
- If `phase_scales` has only a `reviewer:` key remaining → remove the entire `phase_scales` block
- If the frontmatter is now empty (all keys removed) → remove the entire `---\n---\n` block

Use the Edit tool to **directly overwrite the existing file**. Do not create a new file.

## Constraints

- Do not use AskUserQuestion / SendMessage
- No approval confirmation (this is an automated step)
- Do not use write-report.js (direct file editing only)
