# Developer Rules

## Available Skills
- `.claude/skills/project/coding-conventions.md` (if present) — **Must be Read first before starting work**
- `.claude/skills/project/git-workflow` (if present)
- `.claude/skills/project/debug-loop` (if present)
- `.claude/skills/project/refactor` (if present)

## Pre-Work Report Reading
See "Report Reading Rules (Common)" in `.claude/skills/agents/report-output-common.md` for full details.

Upstream reports (read the latest):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (confirm requirements and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (confirm interfaces and data flow)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest (confirm assigned tasks; note its timestamp as T_plan)

Downstream reports (filter to those after T_plan, then read the latest):
4. From `.claude/reports/test-report-*.md`, read the latest among those newer than T_plan (treat as "untested this cycle" if none)
5. From `.claude/reports/code-review-report-*.md`, read the latest among those newer than T_plan (treat as "unreviewed this cycle" if none)
6. From `.claude/reports/security-review-report-*.md`, read the latest among those newer than T_plan (treat as "unassessed this cycle" if none)

Other:
7. Read `.claude/reports/approvals.jsonl` (if it exists) (to understand approval/rejection trends)

## Coordination with Tester
- Writing and running tests is the responsibility of the tester agent; the developer does not do this
- After completing implementation, notify the tester to request testing (Green complete → tester verifies → Refactor → tester re-verifies)
- When addressing tester feedback (current-cycle test-report), always identify the root cause before fixing (do not fix by guessing)

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

---

# TDD Rules

## Red → Green → Refactor Cycle
1. **Red**: Write a failing test first
2. **Green**: Write the minimum code necessary to pass the test
3. **Refactor**: Improve the code while keeping tests passing

## Test Writing Principles
- Describe what is being tested clearly in the test name
  - Good example: `test('returns 404 when user ID does not exist')`
  - Bad example: `test('test1')`
- Tests must be able to run independently (no inter-test dependencies)
- Use mocks only for external dependencies (DB, API, file system)
- Each test should verify only one thing

## Coverage Guidelines
- Business logic: 90% or above
- Utility functions: 80% or above
- UI components: Cover main interactions

## When Tests Are Not Required
- Configuration files and constant definitions
- Simple getter-only DTOs
- Third-party library wrappers (the library itself is already tested)

---

# Git Workflow Rules

## Branch Strategy
- `main` / `master`: Production. Direct commits prohibited
- `develop`: Development integration branch
- `feature/{ticket-id}-{description}`: Feature development
- `fix/{ticket-id}-{description}`: Bug fixes
- `chore/{description}`: Housekeeping (dependency updates, config changes)

## Commit Message Rules (Conventional Commits)
```
{type}({scope}): {summary}

{body} (optional)

{footer} (optional: BREAKING CHANGE, Closes #123)
```

### Type List
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation-only changes
- `style`: Formatting changes (no functional impact)
- `refactor`: Refactoring (no feature addition or bug fix)
- `test`: Adding or modifying tests
- `chore`: Build, tools, or dependency changes

## Prohibited Actions
- Do not execute `git push --force` without user confirmation
- Direct pushes to `main` / `master` are prohibited
- Commit messages must not be just "fix" or "update" alone (describe what was fixed)
- Avoid giant commits (consider splitting changes over 500 lines)
