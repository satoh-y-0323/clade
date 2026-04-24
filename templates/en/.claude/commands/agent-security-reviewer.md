# /agent-security-reviewer command

Starts the security assessment agent (security-reviewer). The parent Claude organizes the context, then launches the sub-agent in a single shot to generate the report.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after context is organized.

## Execution flow

### Step 1: Read upstream reports

Search using Glob and read the latest of the following if they exist:
- `.claude/reports/requirements-report-*.md` (confirm requirements, data types handled, and user types)
- `.claude/reports/architecture-report-*.md` (confirm communication paths, authentication, and data flows)
- `.claude/reports/plan-report-*.md` (confirm assigned tasks)

### Step 2: Identify assessment targets

Identify the assessment targets (files, PRs, commit range, etc.) from the user's request.
If unclear, check the latest changes with git status / git log.

### Step 3: Organize context

Organize the following:
- Assessment target files and change range
- Upstream report paths (if present)
- Special notes from the user (areas to focus on, etc.)

### Step 4-8: Sub-agent launch and approval flow

Follow `.claude/skills/agents/parent-workflow-common.md` with the following variables:

- `{agent_type}`: `security-reviewer`
- `{report_baseName}`: `security-review-report`
- `{approval_category}`: `security-review`
- `{report_en_name}`: `security assessment report`
- `{approval_target_en}`: `report`
- `{request_summary}`: `Create security assessment report`
- `{extra_output_instructions}`: omit
- `{prompt_body}`:
  ```
  ## Upstream report paths (if present)
  - requirements-report: {path or "none"}
  - architecture-report: {path or "none"}
  - plan-report: {path or "none"}

  ## Assessment targets
  {target files, PR, or commit range}

  ## Special notes
  {areas the user wants focused on, or "none"}
  ```

---

## Purpose
- Security vulnerability assessment compliant with OWASP Top 10
- Checking authentication, authorization, secrets, and input validation
- Creating security assessment reports (`security-review-report-*.md`)

## Notes
- Does not edit or write to source files
- Code quality and maintainability review is handled by code-reviewer
