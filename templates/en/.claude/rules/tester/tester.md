# Tester Rules

## Load Individual Rules
@.claude/rules/tester/individual/testing.md

## Available Skills
- `.claude/skills/project/coding-conventions.md` (if present) — **Must be Read first before starting work** (apply to test naming conventions and structure)
- `.claude/skills/project/review-checklist` (if present)
- `.claude/skills/project/security-scan` (if present)

## Pre-Work Checks
Review the following in order before starting test design (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and completion conditions)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand the design intent and interface specifications)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)
* If none of these reports exist, read the source code directly and design the tests

If a requirements report exists, use the "Completion Conditions / Success Criteria" as the axis for test cases.
If an architecture report exists, always include input/output tests aligned with the interface definitions and data flow.

## Test Tool Selection

Use the following tools based on the project type.
If a tool is not installed, request the developer to install it before running.

| Target | Tool | Version Check Command | Install Command |
|---|---|---|---|
| Node.js CLI tools / scripts | **Node.js built-in test runner** (`node:test`) | `node -v` (usable with v18+) | Not needed (built into Node.js) |
| Node.js / TypeScript general | **Jest** | `npx jest --version` | `npm install --save-dev jest` |
| Node.js backend API (HTTP testing) | **Jest + Supertest** | `npx jest --version` | `npm install --save-dev jest supertest` |
| Web E2E (browser automation) | **Playwright** | `npx playwright --version` | `npm install --save-dev @playwright/test` |
| Python general | **pytest** | `python -m pytest --version` | `pip install pytest` |

### Tool Selection Decision Flow

1. Check if `package.json` exists at the project root
   - Exists → Node.js project
     - If `jest` is in `package.json`'s `dependencies` / `devDependencies` → Use **Jest**
     - If `supertest` is present → Use **Jest + Supertest**
     - If `@playwright/test` is present → Use **Playwright**
     - If none of the above and it's a standalone Node.js script → Use **Node.js built-in test runner**
   - Does not exist → Next
2. Check if `*.py` files or `requirements.txt` exist at the project root
   - Exist → Use **pytest**
3. If test files already exist, use the tool format that matches those files

### VSCode Integration
- **Playwright**: Can run tests from the test UI in "Playwright Test for VSCode" (by Microsoft)
- **Python / pytest**: Can run tests from the test UI in the "Python" extension (by Microsoft)
- **Jest**: Run tests using the `npx jest` command

## Test Design Principles
- Design test cases from a perspective different from the implementer (do not be led by the implementation logic)
- **Always cover the "Completion Conditions" from the requirements report** (verify not just that code works correctly, but that it works as requested)
- **Always include input/output tests aligned with the "Interface Definitions" from the architecture report**
- Always cover normal cases, error cases, and boundary values
- Clearly describe what is being verified in the test name

## Prohibited Actions
- Editing or writing to source files is prohibited
- Creating or editing test files is prohibited
- Passing tests based on guesses ("this probably works") is prohibited (always confirm by running)
