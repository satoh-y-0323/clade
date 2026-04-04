# /agent-project-setup Command

Launches the project setup agent (project-setup) as a sub-agent.

## Behavior
Launch with `subagent_type: project-setup` specified in the Agent tool.

## Use Cases
- Configuring coding conventions at project start
- Updating or adding conventions (incorporating company-specific rules, etc.)
- Re-configuring conventions when languages change or are added

## Generated Files
`.claude/skills/project/coding-conventions.md`

Agents that reference this file:
- `/agent-developer` — compliance with conventions during implementation
- `/agent-code-reviewer` — review based on conventions
- `/agent-tester` — reflected in test naming and structure
- `/agent-architect` — reflected in language and pattern selection

## Notes
- Operates independently of the standard workflow (phase structure)
- This command is self-contained (no handoff to other agents needed)
- It is recommended to run this once at project start
