# /agent-architect Command

Launches the architecture and design agent (architect) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/architect.md` to review the rules before starting work.

## Behavior
Launch with `subagent_type: architect` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

## Use Cases
- System design, architecture decisions, and technology selection
- Creating ADRs (Architecture Decision Records)
- Creating architecture design reports (`architecture-report-*.md`)

## Notes
- Always check the latest `requirements-report-*.md` before starting work
