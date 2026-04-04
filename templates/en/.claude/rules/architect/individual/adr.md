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
