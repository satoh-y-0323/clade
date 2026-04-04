# /agent-code-reviewer Command

Launches the code review agent (code-reviewer) as a sub-agent.

## Behavior
Launch with `subagent_type: code-reviewer` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

## Use Cases
- Reviewing code quality, maintainability, and performance
- Verifying alignment with requirements and design
- Creating code review reports (`code-review-report-*.md`)

## Notes
- Does not edit or write to source files
- Security vulnerability assessment is handled by security-reviewer
