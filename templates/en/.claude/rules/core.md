# Core Rules (Common to All Agents)

## Working Principles
- Always check the current state before making changes (Read tool / git status / Glob tool)
- Maintain one commit per task
- Identify the root cause before fixing errors (do not fix by guessing)
- Ask the user for clarification when uncertain before proceeding
- Always confirm with the user before deleting files

## Communication
- Present a 1–3 line plan before starting work
- Report concisely what was done after completion
- If something fails, explain the reason and present alternatives
- Report progress during long-running tasks

## Security
- Do not write secret keys, API keys, or passwords directly in code
- Confirm that .env files are included in .gitignore
- Always confirm with the user before force pushing

## Standard Workflow (Phase Structure)

### Mandatory Rules for AI
When the AI autonomously selects and coordinates agents, the following workflow **must be strictly followed**.
Skipping phases or changing the order is prohibited.

### Confirmation Rules When User Directly Specifies an Agent
When the user directly calls `/agent-xxx`, confirm the following before starting work:

```
Would you like to proceed according to the standard workflow (phase structure)?
  [yes] Follow the workflow and coordinate with the next phase
  [no]  Only perform this agent's work, then report completion to the user and stop
```

- **If yes**: Strictly follow the standard workflow below
- **If no**: Only perform the specified agent's work, then report completion to the user (no handoff to the next agent)

---

### Phase 1: Requirements and Design
```
Step 0. /agent-interviewer  → Requirements gathering, output requirements-report, approval
        * Always perform for feature additions and bug fixes. May be skipped for new development.
Step 1. /agent-architect    → Read requirements-report, design, output architecture-report, approval
```
Reports present at the end of this phase: requirements-report, architecture-report

### Phase 2: Initial Planning
```
Step 2. /agent-planner      → Read requirements-report + architecture-report
                              Output initial plan-report, approval
                              * test/review reports do not yet exist at this stage (normal)
```
Reports present at the end of this phase: + plan-report

### Phase 3: Implementation and Testing (TDD Cycle)
```
Step 3. /agent-tester       → Review plan-report, design test specs, write failing tests (Red)
Step 4. /agent-developer    → Review plan-report, implement (Green → Refactor)
Step 5. /agent-tester       → Re-run tests, output test-report, approval
```
Reports present at the end of this phase: + test-report

### Phase 4: Review and Plan Update
```
Step 6. /agent-code-reviewer     → Output code-review-report, approval
Step 7. /agent-security-reviewer → Output security-review-report, approval
Step 8. /agent-planner           → Integrate all reports, output updated plan-report, approval
```
Repeat Steps 3–8 until there are no more issues.

### TDD Flow (developer ↔ tester)
1. `/agent-tester` designs test specs and writes failing tests (Red)
2. `/agent-developer` implements (Green) → ask tester to re-verify
3. `/agent-developer` refactors (Refactor) → ask tester to re-verify
4. Repeat 2–3 until all tests pass
