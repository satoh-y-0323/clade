# /agent-doc-writer command

Launches the document writer agent (doc-writer) as a subagent.

## Behavior
Starts the agent using the Agent tool with `subagent_type: doc-writer`.

## Use cases
- Generating Mermaid diagrams (flowcharts, class diagrams, ER diagrams, sequence diagrams)
- Creating or updating README files
- Writing operation manuals and runbooks
- Creating API specifications
- Reverse-engineering specifications from existing code

## Output files
The output destination is selected by the user during the interview:
- `.claude/reports/doc-*.md` (temporary storage)
- Any path within the project (e.g., `docs/architecture.md`)
- Display only (no file saved)

## Notes
- Operates independently from the standard workflow (phases)
- This command is self-contained (no handoff to other agents)
- Does not modify source code
