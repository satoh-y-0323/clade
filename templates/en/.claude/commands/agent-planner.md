# /agent-planner Command

Launches the planning agent (planner) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/planner.md` to review the rules before starting work.

## Behavior
Launch with `subagent_type: planner` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

## Use Cases
- Creating work plans based on requirements and architecture reports
- Assigning tasks to each agent
- Creating work plan reports (`plan-report-*.md`)

## Notes
- Does not edit or write to source files
- On first call, only reference `requirements-report` and `architecture-report` (test/review reports do not yet exist, so skip them)
- On update calls, reference all reports to reflect differences
