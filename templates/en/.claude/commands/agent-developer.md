# /agent-developer Command

Launches the implementation and debugging agent (developer) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/developer.md` to review the rules before starting work.

## Behavior
Launch with `subagent_type: developer` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

## Use Cases
- Implementing new features, fixing bugs, and refactoring
- Addressing feedback from the tester
- Test creation and execution are handled by the tester agent; the developer does not do this

## Notes
- Always check the latest `plan-report-*.md` before starting work
- After completing implementation, request testing from the tester agent
