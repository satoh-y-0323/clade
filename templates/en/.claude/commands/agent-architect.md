# /agent-architect command

Starts the architecture and design agent (architect). The parent Claude handles Q&A with the user, then launches the sub-agent in a single shot to generate the report.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after Q&A is complete.

## Execution flow

### Step 1: Read upstream reports

Search for `.claude/reports/requirements-report-*.md` using Glob and read the latest file.
If no requirements-report exists, skip and confirm requirements directly during Q&A.

### Step 2: Q&A

**Always conduct Q&A regardless of whether a requirements-report exists.**

The architect's core role is to dig deeper into requirements from a design perspective. Even when a requirements-report is present, do not skip Q&A.

Output the following questions one by one and wait for the user's response (output one question at a time, then proceed after receiving the answer).

**When requirements-report exists:**

**Q1: Confirm design scope**

```
I've reviewed the requirements definition report. Before proceeding with the design, let me confirm a few points.

First, let me confirm the scope of this design session.
- Should I design the entire system as described in the requirements report?
- Or would you like to focus on a specific feature or component?

(Examples: full system design / authentication module only / API layer only / etc.)
```

**Q2: Points to dig deeper**

```
Are there any tradeoffs or technology choices you'd particularly like me to focus on in the design?

{If the requirements-report has a "handover to architect" section, reference those items in the questions}

Examples:
- Performance-first vs. development speed-first
- Monolithic vs. microservices
- Data consistency vs. availability / etc.
```

**Q3: Constraints and priorities**

```
Let me confirm the design constraints and priorities.

- Are there any quality characteristics you particularly want to prioritize (performance, security, maintainability, etc.)?
- Are there any existing technology stacks or libraries that must be kept?
```

**When no requirements-report exists:**

**Q1: Confirm design target**

```
What feature or system are you designing?
Please describe the design target and its background.
```

**Q2: Technology choices and tradeoffs**

```
Are there any tradeoffs or technology choices you'd particularly like me to focus on in the design?

Examples:
- Performance-first vs. development speed-first
- Monolithic vs. microservices / etc.
```

**Q3: Constraints and priorities**

```
Let me confirm the design constraints and priorities.

- Are there any quality characteristics you particularly want to prioritize (performance, security, maintainability, etc.)?
- Are there any existing technology stacks or libraries that must be kept?
```

### Step 3: Organize Q&A results

Organize the user's answers into the following structure:
- Confirmed technical requirements and constraints
- Tradeoff selection results
- Priority quality characteristics
- Design premises

### Step 4-8: Sub-agent launch and approval flow

Follow `.claude/skills/agents/parent-workflow-common.md` with the following variables:

- `{agent_type}`: `architect`
- `{report_baseName}`: `architecture-report`
- `{approval_category}`: `architecture`
- `{report_en_name}`: `architecture design report`
- `{approval_target_en}`: `design`
- `{request_summary}`: `Create architecture design report`
- `{extra_output_instructions}`: omit
- `{prompt_body}`:
  ```
  ## Upstream report path
  - requirements-report: {path or "none"}

  ## Q&A results with user

  ### Q1: Clarification answers
  A: {answer}

  ### Q2: Tradeoff selection
  A: {answer}

  ### Q3: Constraints and priorities
  A: {answer}
  ```

---

## Purpose
- System design, architecture decisions, and technology selection
- Creating ADRs (Architecture Decision Records)
- Creating architecture design reports (`architecture-report-*.md`)

## Notes
- Always check the latest `requirements-report-*.md` before starting work (Step 1)
