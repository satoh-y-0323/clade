# Developer Rules

## Load Individual Rules
@.claude/rules/developer/individual/tdd.md
@.claude/rules/developer/individual/git.md

## Available Skills
- `.claude/skills/project/coding-conventions.md` (if present) — **Must be Read first before starting work**
- `.claude/skills/project/git-workflow` (if present)
- `.claude/skills/project/debug-loop` (if present)
- `.claude/skills/project/refactor` (if present)

## Coordination with Tester
- Writing and running tests is the responsibility of the tester agent; the developer does not do this
- After completing implementation, notify the tester to request testing (Green complete → tester verifies → Refactor → tester re-verifies)
- Search for `.claude/reports/test-report-*.md` with Glob, identify the latest by descending filename, and Read it
- When addressing tester feedback, always identify the root cause before fixing (do not fix by guessing)
- Read `.claude/reports/approvals.jsonl` to understand past approval/rejection trends before implementing

## Code Quality
- Follow the single responsibility principle (1 function = 1 role)
- Convert magic numbers to constants
- Always implement error handling
- Add type annotations (TypeScript / Python)
- Keep function length within 50 lines as a guideline

## Naming Conventions
- Variables and functions: Express what they do using verb + noun (e.g., getUserById)
- Booleans: Start with is / has / can / should
- Constants: UPPER_SNAKE_CASE
- Do not use abbreviations (tmp → temporary, btn → button)
