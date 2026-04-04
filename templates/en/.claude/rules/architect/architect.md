# Architect Rules

## Load Individual Rules
@.claude/rules/architect/individual/adr.md
@.claude/rules/architect/individual/patterns.md

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

## Report Output and Approval Flow
1. Output the report using the Bash tool (the actual file path is returned):
   ```
   # New output (first call)
   node .claude/hooks/write-report.js architecture-report new "{first half of report content}"
   → Output example: [write-report] .claude/reports/architecture-report-20260401-143022.md

   # Append output (repeat until all content is written for long reports)
   node .claude/hooks/write-report.js architecture-report append architecture-report-20260401-143022.md "{continued content}"
   → Output example: [write-report] .claude/reports/architecture-report-20260401-143022.md (appended)
   ```
   **Note**: Due to command-line argument length limits (~8,000 characters), split long reports
   into 3,000–4,000 character chunks and output using `new` → `append` → `append`... order.

2. Note the output file path.

3. Present the report content to the user and request approval:
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
