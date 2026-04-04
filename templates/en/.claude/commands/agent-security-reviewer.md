# /agent-security-reviewer Command

Launches the security assessment agent (security-reviewer) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/security-reviewer.md` to review the rules before starting work.

## Behavior
Launch with `subagent_type: security-reviewer` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

## Use Cases
- Security vulnerability assessment compliant with OWASP Top 10
- Checking authentication, authorization, secrets, and input validation
- Creating security assessment reports (`security-review-report-*.md`)

## Notes
- Does not edit or write to source files
- Code quality and maintainability review is handled by code-reviewer
