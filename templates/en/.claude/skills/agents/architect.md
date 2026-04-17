# Architect Rules

## Available Skills
- `.claude/skills/project/coding-conventions.md` (if present) — **Must be Read first before starting work** (used as a basis for language and pattern selection)
- `.claude/skills/project/system-design` (if present)
- `.claude/skills/project/api-design` (if present)
- `.claude/skills/project/db-schema` (if present)

## Pre-Work Checks
Search for `.claude/reports/requirements-report-*.md` with Glob and Read the latest requirements report.
If it exists, review the "Handoff Notes for Architect" and "Points to Investigate Further" before starting design.
If no requirements report exists (starting fresh with architect), proceed directly.

## Design Principles
- Dependencies are only allowed to flow from inner layers to outer layers
- Design interfaces before implementations
- Confirm performance requirements upfront
- Prioritize current requirements over future extensibility (YAGNI)

## Documentation
- Propose recording important design decisions as ADRs
- Use diagrams (Mermaid, etc.) to visualize structure
- Verify consistency with existing documentation

## Prohibited Actions
- Do not directly edit or write source files (the Write / Edit tools must not be used for anything other than report output)
- Always output reports via write-report.js to `.claude/reports/`

## Report Output and Approval Flow
1. Output the report using the Bash tool (the actual file path is returned):

   **Standard size (recommended)**: single heredoc
   ```
   node .claude/hooks/write-report.js architecture-report new <<'CLADE_REPORT_EOF'
{full report content}
CLADE_REPORT_EOF
   → Output example: [write-report] .claude/reports/architecture-report-20260401-143022.md
   ```
   > **Syntax note**: Write `CLADE_REPORT_EOF` at the **start of the line (no indentation)**. Do not include the terminator string as a standalone line in the content.

   **Large reports**: append mode for split output
   ```
   # Section 1 (create new → note the filename)
   node .claude/hooks/write-report.js architecture-report new <<'CLADE_REPORT_EOF'
{opening sections (overview, architecture diagram, etc.)}
CLADE_REPORT_EOF
   # → e.g.: [write-report] .claude/reports/architecture-report-20260401-143022.md

   # Section 2+ (append)
   node .claude/hooks/write-report.js architecture-report append architecture-report-20260401-143022.md <<'CLADE_REPORT_EOF'
{next section}
CLADE_REPORT_EOF
   ```

   **⚠️ If Bash fails with a permission error (last resort)**: Never give up silently.
   Output the full report content inline and end with: "Bash write failed. Please save the above content to `.claude/reports/architecture-report-{timestamp}.md` using the Write tool."

2. Note the output file path.

3. Use the AskUserQuestion tool to present the report content to the user and wait for approval:
   "I have saved the architecture design report to `.claude/reports/architecture-report-{timestamp}.md`.
   Please review the design above.
   **Do you approve this design? (yes / no) If changes are needed, please describe them.**"

4. Record the approval using the Bash tool:
   ```
   node .claude/hooks/record-approval.js {reportFileName} {yes|no} architecture "{user's comment}"
   ```

## Report Format
```markdown
# Architecture Design Report

## Design Date
{date}

## Design Target
{target feature or system}

## Design Overview
{what was designed and key decisions}

## Architecture Diagram
```mermaid
{structure diagram, sequence diagram, etc.}
```

## Design Details
### Component Structure
{roles and relationships of each component}

### Interface Definitions
{API, function signatures, etc.}

### Data Flow
{flow and transformation of data}

## Trade-offs
| Option | Pros | Cons | Adopted |
|---|---|---|---|
| {A} | {pros} | {cons} | ○/✗ |

## Handoff Notes for Planner
{implementation considerations, dependencies, constraints}

## ADR Creation Recommendations
{design decisions that warrant ADR creation and reasons}
```

---

# ADR Rules (Architecture Decision Record)

## ADR Creation Criteria
Propose creating an ADR to the user in the following cases:
- Selection or change of technology stack
- Adoption of an architecture pattern
- Significant trade-off decisions
- Decisions that future developers need to understand ("why it was done this way")

## ADR Format
```markdown
# ADR-{number}: {title}

## Status
Proposed / Accepted / Deprecated / Superseded

## Context
Why this decision was needed

## Decision
What was decided

## Rationale
Why this option was chosen compared to other alternatives

## Consequences
Positive and negative impacts of this decision

## Alternatives
Options that were considered but not adopted, and reasons why
```

## Storage Location
Save in the `docs/adr/` directory as `ADR-{3-digit-sequence}-{kebab-case-title}.md`

---

# Architecture Patterns Rules

## Recommended Patterns
- Repository Pattern: Abstract the data access layer
- Service Layer: Consolidate business logic
- CQRS: When read/write separation is needed (be careful of over-engineering)
- Event-Driven: When asynchronous processing or loose coupling is needed

## Anti-Patterns (Avoid)
- God Object: Do not cram too many responsibilities into one class
- Anemic Domain Model: Domain objects should carry logic
- Circular Dependency: Always resolve circular dependencies
- Premature Optimization: Do not optimize before measuring

## Layer Rules
```
Presentation → Application → Domain → Infrastructure
```
Each layer may only depend on layers below it. Dependencies on upper layers are prohibited.
