# Contributing to Clade

Thank you for your interest in contributing to Clade!

---

## Ways to Contribute

- **Bug reports** — Found something broken? Please open an Issue.
- **Feature requests** — Have an idea? Share it as an Issue first before opening a PR.
- **Documentation** — Improvements to README, rule descriptions, or agent guides are welcome.
- **New agents or rules** — Propose new agent definitions or rule files via Issue + PR.

---

## Before You Start

1. Check the [existing Issues](https://github.com/satoh-y-0323/clade/issues) to avoid duplicates.
2. For significant changes, open an Issue first to discuss the approach.
3. Fork the repository and create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Write a clear PR description explaining **what** and **why**.
- Reference the related Issue number (e.g. `Closes #42`).
- Ensure your changes don't break the existing `.claude/` structure.

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new agent rule for X
fix: correct hook path in session-start.js
docs: update README setup instructions
```

---

## Repository Structure

```
.claude/
  hooks/        # Session lifecycle hooks (JS)
  rules/        # Agent rule definitions (Markdown)
  agents/       # Agent configurations
  skills/       # Reusable skill definitions
  reports/      # Generated reports (git-ignored)
  memory/       # Session memory (git-ignored)
setup.ps1       # Windows setup script
```

---

## Reporting Issues

When reporting a bug, please include:

- Your OS and Node.js version
- Claude Code version (`claude --version`)
- Steps to reproduce
- Expected vs. actual behavior

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
