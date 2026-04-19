# Core Rules (shared by all agents)

## Work principles
- Keep the granularity of 1 task = 1 commit
- When something is unclear, confirm with the user before proceeding
- Never pass long text to Bash commands as a command-line argument.
  Reason: OS argument length limits (roughly 8,000 characters) will cause errors.
  Alternative: pass it via stdin using a heredoc (`<<'EOF'`) or a pipe.
- If a Bash command fails with an argument length error, do not try other workarounds yourself.
  Report the error to the user and wait for instructions.

## Communication
- State the plan in 1–3 lines before starting work
- After finishing, briefly report what you did
- If something fails, report the reason and propose an alternative
- For long-running tasks, report progress as you go

## Security
- Do not hard-code secret keys, API keys, or passwords
- Verify that `.env` files are listed in `.gitignore`

## Standard workflow (phase structure)

### Strict rule for the AI
When the AI autonomously selects and chains agents, it **must strictly follow** the workflow below.
Skipping phases or reordering them is forbidden.

### Confirmation rule when the user invokes an agent directly
When the user calls `/agent-xxx` directly, confirm the following before starting:

```
Should we proceed along the standard workflow (phase structure)?
  [yes] Follow the workflow and hand off to the next phase as well
  [no]  Only perform this agent's work, then report back and finish
```

- **If yes**: Strictly follow the standard workflow below.
- **If no**: Perform only the specified agent's work, report completion to the user, and finish (do not hand off to the next agent).

Note: Q&A with the user, approval confirmation, and restart on rejection are all handled by the parent Claude. Sub-agents only execute report/file generation and then exit.

---

### Phase 1: Requirements and design
```
Step 0. /agent-interviewer  → Gather requirements, output requirements-report, get approval
        Always run this for feature additions / bug fixes. For new-from-scratch development it can be skipped.
Step 1. /agent-architect    → Read requirements-report, design, output architecture-report, get approval
```
Reports present at the end of this phase: requirements-report, architecture-report

### Phase 2: Initial planning
```
Step 2. /agent-planner      → Read requirements-report + architecture-report
                              output the initial plan-report, get approval
                              (test/review reports do not exist yet, so skip them — normal)
```
Reports present at the end of this phase: + plan-report

### Phase 3: Implementation and testing (TDD cycle)
```
Step 3. /agent-tester       → Review plan-report, design test specs, write failing tests (Red)
Step 4. /agent-developer    → Review plan-report, implement (Green → Refactor)
Step 5. /agent-tester       → Re-run tests, output test-report, get approval
```
Reports present at the end of this phase: + test-report

### Phase 4: Review and plan update
```
Step 6. /agent-code-reviewer     → Output code-review-report, get approval
Step 7. /agent-security-reviewer → Output security-review-report, get approval
Step 8. /agent-planner           → Integrate all reports, output an updated plan-report, get approval
```
Repeat Step 3–8 until there are no remaining findings.

### TDD flow (developer ↔ tester)
1. `/agent-tester` designs test specs and writes failing tests (Red)
2. `/agent-developer` implements (Green) → ask the tester to re-verify
3. `/agent-developer` refactors (Refactor) → ask the tester to re-verify
4. Repeat 2–3 until there are no failures

---

### Milestone-aware workflow

For large-scale development, the `plan-report` may define milestones.
A milestone represents a unit of development that leaves the system in a "verifiable" state; commit on completion.

#### Planner responsibility (at planning time)
Before requesting approval of a `plan-report` that contains milestones, always confirm the following with the user:

```
Choose the behavior after completing each milestone:
  [confirm] After each milestone completes and is committed, show a "continue?" confirmation dialog
            (choose this if you may want to stop partway through)
  [auto]    After each milestone completes and is committed, automatically proceed to the next milestone without asking
            (choose this if you want to finish the whole thing today)
```

Record the selection in the meta-info section at the top of the `plan-report`:

```
## Meta info
- milestone_mode: confirm  # or auto
```

For small plans that do not involve milestones, this confirmation can be skipped.

#### Developer responsibility (at implementation time)
When reading `plan-report`, if the prompt specifies "target milestone: N", implement and commit only the tasks for that milestone and stop there — do not proceed to the next milestone.

Continuation between milestones (`milestone_mode: confirm` / `auto`) is controlled by the `/agent-developer` command (the parent Claude).
