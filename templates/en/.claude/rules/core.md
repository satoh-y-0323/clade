# Core Rules (Common to All Agents)

## Working Principles
- Always check the current state before making changes (Read tool / git status / Glob tool)
- Maintain one commit per task
- Identify the root cause before fixing errors (do not fix by guessing)
- Ask the user for clarification when uncertain before proceeding
- Always confirm with the user before deleting files
- Never pass long content as command-line arguments to Bash commands.
  Reason: OS argument length limits (~8,000 characters) will cause errors.
  Alternative: Use heredoc (`<<'EOF'`) or pipes to pass content via stdin.
- If a Bash command fails due to argument length limits, do not attempt alternative approaches on your own.
  Report the error to the user and wait for instructions.

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

---

### Milestone Workflow

In large-scale development, `plan-report` may include milestones.
A milestone is a development unit that represents a state where the work so far can be verified as functional, and a commit is made upon completion.

#### Planner Responsibilities (during planning)
When outputting a plan that includes milestones, always ask the user the following before requesting approval of the `plan-report`:

```
Choose behavior after each milestone completes:
  [confirm] Show a "Continue to next milestone?" dialog after each milestone commit
            (choose this if you may want to pause mid-way)
  [auto]    Automatically proceed to the next milestone after each commit without confirmation
            (choose this if you want to complete everything today)
```

Record the selection in the meta section at the top of the `plan-report`:

```
## Meta
- milestone_mode: confirm  # or auto
```

This confirmation may be omitted for small plans with no milestones.

#### Developer Responsibilities (during implementation)
When the prompt specifies "Target milestone: N", implement only that milestone's tasks, commit, and end work without proceeding to the next milestone.

Continuation confirmation between milestones (`milestone_mode: confirm` / `auto`) is controlled by the `/agent-developer` command (parent Claude).
