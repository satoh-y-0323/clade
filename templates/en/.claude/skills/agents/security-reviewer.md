# Security Reviewer Rules

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
   # Output all at once via heredoc (newlines preserved, no length limit, no splitting needed)
   node .claude/hooks/write-report.js security-review-report new <<'REPORT'
   {full report content}
   REPORT
   → Output example: [write-report] .claude/reports/security-review-report-20260401-143022.md
   ```
   **Note**: Use heredoc (`<<'REPORT'`) to preserve newlines and bypass command-line argument length limits. No need to split the report content.

2. Note the output file path.

3. Use the AskUserQuestion tool to present the report content to the user and wait for approval:
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

---

# Security Review Checklist

## Required Check Items (OWASP Top 10 Compliant — Common to All Deliverables)

### Injection
- [ ] Is SQL injection mitigated? (Use of placeholders and parameter binding, etc.)
- [ ] Is OS command injection mitigated? (Shell calls prohibited, argument escaping)
- [ ] Is XSS (Cross-Site Scripting) mitigated? (Output escaping, CSP)
- [ ] Is LDAP injection mitigated? (when LDAP is used)
- [ ] Is XML injection / XXE mitigated? (when processing XML)

### Authentication and Authorization
- [ ] Is authentication properly implemented?
- [ ] Is authorization checking implemented on all endpoints?
- [ ] Is session fixation attack mitigated? (Is session ID regenerated after login?)
- [ ] Is session management appropriate? (timeout, Secure attribute, HttpOnly attribute)
- [ ] Is session hijacking mitigated? (Secure/HttpOnly Cookie, token validation)
- [ ] Are brute force, dictionary, and password list attacks mitigated? (Account lockout, rate limiting, CAPTCHA)
- [ ] Are replay attacks mitigated? (Nonce, timestamp, one-time token validation)
- [ ] Are passwords properly hashed? (bcrypt, Argon2, etc.)

### Secrets
- [ ] Are API keys, passwords, and tokens not hardcoded?
- [ ] Are secrets managed in .gitignore-protected files?
- [ ] Are secrets not output to logs?

### Input Validation
- [ ] Is all user input validated?
- [ ] Is directory traversal mitigated? (Path sanitization, normalization, absolute path verification)
- [ ] Is file upload validation implemented? (extension, MIME type, size)
- [ ] Is the redirect target URL validated? (Open redirect mitigation)

### Memory Safety
- [ ] Is buffer overflow mitigated? (Boundary checks, safe API usage, memory-safe language selection)

### Communication Security
- [ ] Is HTTPS/TLS enforced? (Sniffing / radio interception mitigation)
- [ ] Is HSTS configured?
- [ ] Is certificate validation correctly implemented? (Disabling self-signed certificates, etc.)

### Dependencies
- [ ] Are there no known vulnerabilities in dependency libraries? (npm audit / pip audit, etc.)
- [ ] Are there no libraries with unnecessary permissions or scopes?

## Recommended Check Items (Common to All Deliverables)
- [ ] Do error messages not expose internal information (stack traces, DB schema, etc.)?
- [ ] Are security headers properly configured? (X-Frame-Options, X-Content-Type-Options, etc.)

---

## Deliverable-Specific Check Items

### Web Applications
- [ ] Is CSRF (Cross-Site Request Forgery) mitigated? (CSRF token, SameSite Cookie)
- [ ] Is formjacking attack mitigated? (CSP and SRI for script tampering detection)
- [ ] Is MitB (Man-in-the-Browser) attack mitigated? (CSP and Subresource Integrity (SRI) configuration)

### Systems with AI Features
- [ ] Is prompt injection attack mitigated? (Input sanitization, output validation, system prompt isolation)

### Email Sending Features
- [ ] Are spam email countermeasures in place? (Send rate limiting, CAPTCHA, SPF/DKIM/DMARC configuration)
- [ ] Is email header injection mitigated?

### Public Web Services
- [ ] Are DDoS / F5 attack (mass requests) countermeasures in place? (Application-layer rate limiting, request count limits)

### Systems Dependent on External APIs or DNS
- [ ] Is the impact of DNS cache poisoning mitigated? (Can communication targets be verified via HTTPS certificate validation even if name resolution is poisoned?)
