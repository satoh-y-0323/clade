# /agent-developer Command

Launches the implementation and debugging agent (developer) as a sub-agent.
Automatically switches between simple mode, milestone mode, and parallel mode based on the plan-report.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/developer.md` to review the rules before starting work.

## Pre-Work

1. Search for `.claude/reports/plan-report-*.md` with Glob and Read the latest file if it exists
2. If a plan-report exists, check:
   - Whether `parallel_groups` is defined in the YAML frontmatter → **parallel mode**
   - Whether `milestone_mode` is listed in the `## Meta` section (`confirm` / `auto` / not listed)
   - Whether a milestone list exists

---

## Simple Mode (no milestones, no plan-report, no parallel_groups)

1. Launch with `subagent_type: developer` in the Agent tool
   - Include the current work context (user's request and presence of existing reports) in the prompt
2. After developer completes, launch `/agent-tester` to request testing
3. Check the test-report; if tests fail, re-launch developer (fix mode) and repeat until tests pass

---

## Milestone Mode (milestones present, no parallel_groups)

Repeat the following for each milestone:

### Per-Milestone Processing

1. Launch with `subagent_type: developer` in the Agent tool
   - Include the following in the prompt:
     ```
     Target milestone: {N} "{title}"
     Implement only the tasks for this milestone and commit.
     Do not proceed to the next milestone.
     ```
2. After developer completes, launch `/agent-tester` to request testing
3. Check the test-report; if tests fail, re-launch developer (fix mode) and repeat until tests pass
4. After tests pass, before proceeding to the next milestone:

**If `milestone_mode: confirm`:**
Use the AskUserQuestion tool to present the following to the user and wait for a response:
```
Milestone {N} "{title}" complete and tests passing. Committed.

Proceed to milestone {N+1} "{title}"?
  [yes] Continue
  [no]  Stop here (run /init-session next session to resume)
```
- If `yes`: proceed to the next milestone
- If `no`: end work and guide the user on how to resume

**If `milestone_mode: auto`:**
Proceed to the next milestone immediately without confirmation.

---

## Parallel Mode (parallel_groups present)

### Step 1: Pre-Implementation Phase (if pre_implementation exists)

1. Launch with `subagent_type: developer` in the Agent tool
   - Include the following in the prompt:
     ```
     This is the pre-implementation phase. Implement and commit the following files.
     These are interfaces, type definitions, and other files that must be finalized before parallel development begins.
     {list of pre_implementation files}
     ```
2. After developer completes, confirm that the commit is done

### Step 2: Parallel Implementation Phase

Launch all groups **simultaneously in the background**:

```
For each group (group-a, group-b, ...):
  Launch with subagent_type: worktree-developer and run_in_background: true in the Agent tool
  Include the following in the prompt:
    - Group ID (e.g., group-a)
    - Task list for that group from plan-report
    - "Call EnterWorktree(name: "group-a") as your first action"
```

### Step 3: Wait for All Groups to Complete

Receive completion notifications from all background agents.
Collect branch names from each agent's completion message.

To get branch names:
- Use the branch names included in each worktree-developer's completion message
- Or confirm with `git worktree list`

### Step 4: Merge Phase

Launch with `subagent_type: merger` in the Agent tool:
```
Include the following in the prompt:
  - Base branch name (typically main)
  - List of branches to merge (collected in Step 3)
```

### Step 5: Post-Merge Testing

After merger completes, launch `/agent-tester` to request testing.
If tests fail, launch developer (fix mode) and repeat until tests pass.

### Step 6: Milestone Continuation Check

If milestones are present, after tests pass, follow `milestone_mode` to confirm continuation to the next milestone (same processing as Milestone Mode Step 4).

---

## Use Cases
- Implementing new features, fixing bugs, and refactoring
- Addressing feedback from the tester
- Test creation and execution are handled by the tester agent; the developer does not do this
