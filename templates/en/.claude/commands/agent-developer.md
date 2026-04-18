# /agent-developer Command

Launches the implementation and debugging agent (developer) as a sub-agent.
Automatically switches between simple mode and milestone mode based on the plan-report.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/developer.md` to review the rules before starting work.

## Pre-Work

1. Search for `.claude/reports/plan-report-*.md` with Glob and Read the latest file if it exists
2. If a plan-report exists, check:
   - Whether `milestone_mode` is listed in the `## Meta` section (`confirm` / `auto` / not listed)
   - Whether a milestone list exists

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
