# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ |
| Older   | ❌ |

We only provide security fixes for the latest release.

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub Issues.**

If you discover a security vulnerability, please report it by opening a [GitHub Security Advisory](https://github.com/satoh-y-0323/clade/security/advisories/new) in this repository.

Please include the following information:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

We will acknowledge receipt within **3 business days** and aim to provide a fix or mitigation within **14 days**, depending on severity.

## Scope

Clade is a local development framework that runs entirely on your machine. Security considerations include:

- **Hook scripts** (`.claude/hooks/`) — executed automatically by Claude Code
- **Settings files** (`.claude/settings.json`) — controls permissions and MCP servers
- **Agent rules** (`.claude/agents/`, `.claude/rules/`) — defines agent behavior

If you find that any of these components could be exploited to execute unintended commands or leak sensitive information, please report it.
