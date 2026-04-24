# /agent-code-reviewer command

Starts the code review agent (code-reviewer). The parent Claude organizes the context, then launches the sub-agent in a single shot to generate the report.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after context is organized.

## Execution flow

### Step 1: Read upstream reports

Search using Glob and read the latest of the following if they exist:
- `.claude/reports/requirements-report-*.md` (confirm requirements and completion criteria)
- `.claude/reports/architecture-report-*.md` (confirm design intent and interface specs)
- `.claude/reports/plan-report-*.md` (confirm assigned tasks)

### Step 2: Identify review targets

Identify the review targets (files, PRs, commit range, etc.) from the user's request.
If unclear, check the latest changes with git status / git log.

### Step 3: Organize context

Organize the following:
- Review target files and change range
- Upstream report paths (if present)
- Special notes from the user (areas to focus on, etc.)

### Step 4-8: Sub-agent launch and approval flow

Follow `.claude/skills/agents/parent-workflow-common.md` with the following variables:

- `{agent_type}`: `code-reviewer`
- `{report_baseName}`: `code-review-report`
- `{approval_category}`: `code-review`
- `{report_en_name}`: `code review report`
- `{approval_target_en}`: `report`
- `{request_summary}`: `Create code review report`
- `{extra_output_instructions}`: omit
- `{prompt_body}`:
  ```
  ## Upstream report paths (if present)
  - requirements-report: {path or "none"}
  - architecture-report: {path or "none"}
  - plan-report: {path or "none"}

  ## Review targets
  {target files, PR, or commit range}

  ## Special notes
  {areas the user wants focused on, or "none"}
  ```

---

## Purpose
- Reviewing code quality, maintainability, and performance
- Verifying alignment with requirements and design
- Creating code review reports (`code-review-report-*.md`)

## Notes
- Does not edit or write to source files
- Security vulnerability assessment is handled by security-reviewer
