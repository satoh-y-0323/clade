# /agent-tester Command

Launches the testing agent (tester) as a sub-agent.

## Rules
**As the first action upon launch**, Read `.claude/skills/agents/tester.md` to review the rules before starting work.

## Behavior
Launch with `subagent_type: tester` specified in the Agent tool.
Include the current work context (user's request and presence of existing reports) in the prompt.

## Use Cases
- Test specification design and writing failing tests (TDD Red phase)
- Running tests and verifying results after developer implementation
- Creating test reports (`test-report-*.md`)

## Notes
- Does not edit or write to source files
- Passing tests based on guesses ("this probably works") is prohibited (always confirm by running)
