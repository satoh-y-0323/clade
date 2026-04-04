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
