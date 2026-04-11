# /prune-rules Skill

Review and clean up rules promoted via cluster-promote.
Handles orphaned cluster entries and merges duplicate/similar rules interactively with the user.

## Steps

### Step 1: Collect Inventory

1. Use `Glob` to retrieve all `.claude/instincts/clusters/*.json` files
2. Read each JSON and extract entries where `type === "rule"`
3. For each rule, check whether `.claude/rules/{name}.md` exists using Glob
4. Classify as:
   - **Normal**: Both clusters JSON and rule file exist
   - **Orphaned cluster**: clusters JSON exists but rule file is missing

If no `type === "rule"` clusters are found, display "No promoted rules found." and exit.

### Step 2: Handle Orphaned Clusters

If orphaned clusters exist, present them in the following format:

```
## Orphaned Clusters (rule file not found)

The following clusters JSON entries have no corresponding rule file:
- {name}: {summary} (promoted: {promotedAt})
...

Delete these clusters JSON files? (Keeping them will trigger this check on every run)
  [yes] Delete
  [no]  Skip
```

If yes: delete the target clusters JSON files using Bash.

### Step 3: Read Normal Rule Files

Read all normal rules (those with existing rule files).

If no normal rules remain, exit.

### Step 4: AI Analysis

Analyze all loaded rules and evaluate for:

- **Merge candidates**: Rules that cover the same or similar ground (pairs or groups)
- **No issues**: Independent and valid rules

### Step 5: Present Analysis Results

Present in the following format:

```
## /prune-rules Analysis

Rules reviewed: N

### Merge Candidates
[A] {rule-a} + {rule-b}
    Reason: {why they overlap or are similar}
    Proposal: Merge into {rule-a}, delete {rule-b}

### No Issues (no changes needed)
- {name}: {summary}
...

Enter the letters to act on (e.g. A) / all / none
```

If no merge candidates are found, display "No duplicate or similar rules found. No cleanup needed." and exit.

### Step 6: Execute Merges

For each approved merge, execute in order:

**6-1. Confirm merged content with user**

```
## Merged Content ({kept rule name}.md)

{merged Markdown content}

Apply this content?
  [yes]  Apply as shown
  [no]   Skip this merge
  [edit] Revise and re-present
```

- `no`: Skip this merge and continue
- `edit`: Incorporate user's revision and re-present

**6-2. Execute file operations**

1. Update the kept rule file using Write
2. Delete the removed rule file using Bash
3. Remove the `@rules/{name}.md` line from CLAUDE.md using Edit
4. Delete the removed rule's clusters JSON file using Bash

### Step 7: Commit

Commit only if changes were made. Commit message format:

```
chore: prune-rules - {summary of actions}

{list of operations performed}

[en-sync: n/a]
```
