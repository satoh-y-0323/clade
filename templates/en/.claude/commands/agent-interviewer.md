# /agent-interviewer Command

Launches the requirements gathering agent (interviewer) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/interviewer.md` to review the rules before starting work.

## Behavior
Launch with `subagent_type: interviewer` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

## Use Cases
- Interviewing before starting work on new features, feature additions, bug fixes, refactoring, etc.
- Creating requirements reports (`requirements-report-*.md`)

## Notes
- Does not edit or write to source files
- Does not propose implementation approaches (that is the architect's role)
