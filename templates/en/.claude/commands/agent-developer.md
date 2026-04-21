# /agent-developer Command

Launches the implementation and debugging agent (developer) as a sub-agent.
Automatically switches between simple mode, milestone mode, and parallel execution mode based on the plan-report.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/developer.md` to review the rules before starting work.

## Pre-Work

1. Search for `.claude/reports/plan-report-*.md` with Glob and Read the latest file if it exists
2. If a plan-report exists, check:
   - Whether `milestone_mode` is listed in the `## Meta` section (`confirm` / `auto` / not listed)
   - Whether a milestone list exists
3. If a plan-report exists, check the YAML frontmatter at the top of the file:
   - Check whether the `parallel_groups` key is present
   - If present, run the following in Bash to check whether clade-parallel is installed:
     ```
     command -v clade-parallel >/dev/null 2>&1 && echo "installed" || echo "not installed"
     ```
   - If `parallel_groups` is present **and** `clade-parallel` is installed → switch to parallel execution mode
   - Otherwise → proceed with simple mode / milestone mode (no warning needed)

---

## Parallel Execution Mode (plan-report defines parallel_groups and clade-parallel is installed)

1. Run the following in Bash to generate manifest.md:
   ```
   node .claude/hooks/plan-to-manifest.js {absolute path to plan-report}
   ```
   Record the path printed to stdout as the manifest path.
   If the script exits with code 1, report the error to the user and stop.

2. Run the following in Bash to start parallel execution:
   ```
   clade-parallel run {manifest path}
   ```
   Wait until complete (timeout_sec follows the task settings in the manifest).

3. Check the results:
   - All tasks succeeded: report completion to the user
   - Any tasks failed: report the failed task name, exit code, and a summary of stderr to the user,
     then ask the user how to proceed (retry or fix in sequential mode)

---

## Simple Mode (no milestones, no plan-report)

1. Launch with `subagent_type: developer` in the Agent tool
   - Include the current work context (user's request and presence of existing reports) in the prompt
2. After developer completes, launch `/agent-tester` to request testing
3. Check the test-report; if tests fail, re-launch developer (fix mode) and repeat until tests pass

---

## Milestone Mode (milestones present)

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

## Use Cases
- Implementing new features, fixing bugs, and refactoring
- Addressing feedback from the tester
- Test creation and execution are handled by the tester agent; the developer does not do this
