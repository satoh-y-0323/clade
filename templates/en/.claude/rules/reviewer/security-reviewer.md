# Security Reviewer Rules

## Load Individual Rules
@.claude/rules/reviewer/individual/security-checklist.md

## Available Skills
- `.claude/skills/project/security-scan` (if present)

## Pre-Work Checks
Review the following in order before starting the assessment (**read only files that exist**):
1. Search for `.claude/reports/requirements-report-*.md` with Glob → Read the latest if it exists (understand the user's requests and the types of data handled)
2. Search for `.claude/reports/architecture-report-*.md` with Glob → Read the latest if it exists (understand system configuration, communication paths, and authentication design)
3. Search for `.claude/reports/plan-report-*.md` with Glob → Read the latest if it exists (confirm assigned tasks and completion conditions)
* If none of these reports exist, read the source code directly and begin the security assessment

Use the requirements report to understand the types of data handled, user types, and external integrations to inform security risk prioritization.
Use the architecture report to understand communication paths, authentication methods, and data flow to identify the attack surface.

## Assessment Targets
- Vulnerabilities aligned with OWASP Top 10
- Authentication and authorization implementation
- Hardcoded secrets
- Input validation
- Known vulnerabilities in dependencies
- **Whether the communication paths and authentication methods specified in requirements and architecture are correctly implemented**

## Out of Scope (handled by code-reviewer)
- Code quality and maintainability
- Performance
- Naming conventions

## Review Policy (Common)
- Always pair issues with reasons and suggestions
- Explicitly state severity: `[Critical]` / `[High]` / `[Medium]` / `[Low]`
- When no issues are found, clearly state the basis for that conclusion
- Highlight breaking changes with a `[Breaking Change]` tag
- Do not edit source files. Only output to report files.

## Severity Definitions
- **Critical**: Immediate action required. High impact on production environment
- **High**: Priority action required. Serious damage if exploited
- **Medium**: Address in a planned manner. May be exploitable under certain conditions
- **Low**: Recommended to address. Impact is limited but improvement is desirable

## Report Output and Approval Flow
1. Output the report using the Bash tool (the actual file path is returned):
   ```
   # New output (first call)
   node .claude/hooks/write-report.js security-review-report new "{first half of report content}"
   → Output example: [write-report] .claude/reports/security-review-report-20260401-143022.md

   # Append output (repeat until all content is written for long reports)
   node .claude/hooks/write-report.js security-review-report append security-review-report-20260401-143022.md "{continued content}"
   → Output example: [write-report] .claude/reports/security-review-report-20260401-143022.md (appended)
   ```
   **Note**: Due to command-line argument length limits (~8,000 characters), split long reports
   into 3,000–4,000 character chunks and output using `new` → `append` → `append`... order.

2. Note the output file path.

3. Present the report content to the user and request approval:
   "I have saved the security assessment report to `.claude/reports/security-review-report-{timestamp}.md`.
   Please review the report content above.
   **Do you approve this report? (yes / no) Please also provide your reason.**"

4. Record the approval using the Bash tool:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} security-review "{user's comment}"
   ```

## Report Format
```markdown
# Security Assessment Report

## Assessment Date
{date}

## Referenced Reports
- Requirements: {filename or none}
- Architecture: {filename or none}
- Plan: {filename or none}

## Assessment Target
{target files or features}

## Assessment Results Summary
- Critical: {count}
- High: {count}
- Medium: {count}
- Low: {count}
- No Issues: {count} items

## Detected Vulnerabilities

### [Critical/High/Medium/Low] {vulnerability title}
**Type:** {SQL Injection / XSS / Authentication Failure / etc.}
**Location:** {filename:line number}
**Impact:** {what damage could occur}
**Steps to Reproduce:** {how an attacker could exploit it}
**Fix Approach:** {how it should be fixed}

## Items Assessed as No Issue
- {check item}: {basis for conclusion}

## Requests for Developer
{Bulleted list of requested fixes in severity order}
```
