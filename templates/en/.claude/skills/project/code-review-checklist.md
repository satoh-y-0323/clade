# Code Review Checklist

## Required Check Items (Common to All Deliverables)

### Code Quality
- [ ] Is the function's responsibility singular? (Single Responsibility Principle — 1 function, 1 role)
- [ ] Is the function length appropriate? (Guideline: within 50 lines. Consider splitting if exceeded)
- [ ] Is the nesting depth appropriate? (Guideline: within 3 levels. Consider early returns or function splits for deep nesting)
- [ ] Are magic numbers and magic strings converted to constants?
- [ ] Is there any dead code (unreachable code, unused variables, unused functions)?
- [ ] Is there any commented-out code left in? (Delete or convert to a ticket)
- [ ] Are there unnecessary debug outputs left in (console.log, print, etc.)?

### Naming Conventions
- [ ] Do variable and function names convey their intent? (Can you understand what they do from the name alone?)
- [ ] Do boolean variable names start with is / has / can / should?
- [ ] Is code written without abbreviations? (tmp → temporary, btn → button, etc.)
- [ ] Is a consistent naming convention followed throughout the codebase? (camelCase / snake_case, etc.)

### Error Handling
- [ ] Are all exceptions and errors handled appropriately?
- [ ] Are errors not being swallowed silently? (No empty catch blocks or silent failures)
- [ ] Are resources (files, DB connections, network) properly released when an error occurs?
- [ ] Are error messages for users appropriate? (No internal info exposed, easy to understand)
- [ ] Is error propagation appropriate? (re-throw, wrap, transform — as needed)

### Logging
- [ ] Is log output at the appropriate level (DEBUG / INFO / WARN / ERROR)?
- [ ] Is personal or sensitive information not output to logs?
- [ ] Do logs contain sufficient information for troubleshooting?
- [ ] Are logs not excessive? (No heavy output inside loops, etc.)

### Tests
- [ ] Have tests been added or updated for new features and fixes?
- [ ] Do all existing tests pass?
- [ ] Is it clear what each test is testing from its name?
- [ ] Are tests not too dependent on internal implementation logic? (Are they testing behavior?)

### Type Safety
- [ ] Are type annotations and type declarations appropriately applied? (TypeScript / Python, etc.)
- [ ] Is there no excessive use of `any` type or type assertions? (If present, is the reason documented in a comment?)
- [ ] Is null / undefined handled safely? (null checks, optional chaining, etc.)

### Maintainability
- [ ] Is there no duplicated code? (DRY principle)
- [ ] Is the design resistant to change? (No magic numbers or hardcoded settings)
- [ ] Are complex logic sections accompanied by explanatory comments?
- [ ] Are there no circular dependencies?

## Recommended Check Items (Common to All Deliverables)
- [ ] Is the addition of dependency libraries justified? (Can it be replaced by an existing library?)
- [ ] Has documentation (README, API specs, etc.) been updated?
- [ ] Is the code change consistent with the architecture policy?

---

## Deliverable-Specific Check Items

### Web API / Backend
- [ ] Are there any N+1 queries? (DB calls inside loops, etc.)
- [ ] Is unnecessary data not being fetched? (Overuse of SELECT *, unnecessary JOINs, etc.)
- [ ] Is the transaction boundary appropriate? (Data consistency when updating multiple tables)
- [ ] Is pagination / item count limiting implemented? (No bulk fetching of large datasets)
- [ ] Does the response not contain unnecessary fields?
- [ ] Is asynchronous processing implemented correctly? (Correct use of Promise / async-await)
- [ ] Are timeouts set? (External API calls, DB connections, etc.)

### Frontend
- [ ] Are there unnecessary re-renders? (Memoization, dependency arrays, etc.)
- [ ] Are there memory leaks? (Cleanup of event listeners, timers, etc.)
- [ ] Are there measures for rendering large amounts of data? (Virtual scrolling, etc.)
- [ ] Are accessibility concerns addressed? (aria attributes, keyboard navigation, contrast)
- [ ] If internationalization (i18n) is needed, is it implemented?

### Batch Processing / Async Processing
- [ ] Is idempotency ensured? (Is it safe to run the same process multiple times?)
- [ ] Can the process recover from mid-process failures? (Re-execution, checkpoints)
- [ ] Is memory usage appropriate? (No bulk loading of large datasets — use streaming, etc.)
- [ ] Are there measures for queue backups and backpressure?

### Libraries / SDKs
- [ ] Is the public API interface stable? (No breaking changes)
- [ ] If there are breaking changes, is the version bumped appropriately? (Semantic versioning)
- [ ] Is the public API documented? (Type definitions, JSDoc / docstring, etc.)
- [ ] Does it not break the user's environment? (No global variable pollution, no side effects)
