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
