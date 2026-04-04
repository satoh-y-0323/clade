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
