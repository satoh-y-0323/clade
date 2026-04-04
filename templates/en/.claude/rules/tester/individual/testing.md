# Testing Rules

## Tester's Role in TDD (Red Phase)
In test-driven development, the tester handles the Red phase.
- Write failing tests **before implementation** (Red)
- After the developer implements and tests pass (Green), the tester re-runs them to verify
- Re-run after the developer refactors to confirm they still pass

## Test Execution and Reporting Flow
1. Review the target requirements and specifications (Read source files if they exist)
2. Design test specifications (normal cases, error cases, boundary values)
3. **Write failing tests before implementation** (Red phase: request developer to append to existing test files)
4. Run the tests: execute the test command using `Bash`
5. Output results to the report following the flow below and confirm approval

## Report Output and Approval Flow
1. Output the report using the Bash tool (the actual file path is returned):
   ```
   # New output (first call)
   node .claude/hooks/write-report.js test-report new "{first half of report content}"
   → Output example: [write-report] .claude/reports/test-report-20260401-143022.md

   # Append output (repeat until all content is written for long reports)
   node .claude/hooks/write-report.js test-report append test-report-20260401-143022.md "{continued content}"
   → Output example: [write-report] .claude/reports/test-report-20260401-143022.md (appended)
   ```
   **Note**: Due to command-line argument length limits (~8,000 characters), split long reports
   into 3,000–4,000 character chunks and output using `new` → `append` → `append`... order.

2. Note the output file path.

3. Present the report content to the user and request approval:
   "I have saved the test report to `.claude/reports/test-report-{timestamp}.md`.
   Please review the report content above.
   **Do you approve this report? (yes / no) Please also provide your reason.**"

4. Record the approval using the Bash tool:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} test "{user's comment}"
   ```

## Report Format
```markdown
# Test Report

## Execution Date
{date}

## Referenced Reports
- Requirements: {filename or none}
- Architecture: {filename or none}
- Plan: {filename or none}

## Test Target
{target files or features}

## Test Results Summary
- Passed: {count}
- Failed: {count}
- Not run: {count}

## Requirements Alignment
| Requirement (Completion Condition) | Test Name | Result |
|---|---|---|
| {completion condition 1 from requirements report} | {corresponding test name} | Passed/Failed/Not run |

## Passed Tests
- [x] {test name}: {result details}

## Failures and Required Fixes
### {test name}
**Expected:** {expected behavior}
**Actual:** {actual behavior}
**Steps to Reproduce:** {steps}
**Priority:** High / Medium / Low

## Unmet Requirements
{Completion conditions from the requirements report that were not verified or failed in testing}

## Requests for Developer
{Bulleted list of requested fixes}
```

## Test Coverage Guidelines
- Business logic: Always cover normal cases, error cases, and boundary values
- Utility functions: Cover all input patterns
- Error handling: Always verify behavior when errors occur

## Boundary Value Test Perspectives
- Minimum and maximum values
- Empty string, null, undefined
- Type mismatches
- One value before and after the acceptable range
