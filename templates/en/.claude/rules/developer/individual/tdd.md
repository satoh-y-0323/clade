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
