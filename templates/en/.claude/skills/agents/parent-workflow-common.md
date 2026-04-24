# Parent Workflow Common Rules

Defines the **common Steps 4-8 flow** that the parent Claude follows when launching a one-shot sub-agent (interviewer / architect / planner / code-reviewer / security-reviewer) from `/agent-{name}` commands.

Each command's Steps 1-3 (upstream report loading / Q&A / context organization) are command-specific and not shared. Sharing Steps 4-8 eliminates duplication across the 5 commands while keeping behavior identical.

## Variables specified by the caller

Each command references this flow with the following variables:

| Variable | Meaning | interviewer | architect | planner | code-reviewer | security-reviewer |
|---|---|---|---|---|---|---|
| `{agent_type}` | subagent_type for the Agent tool | `interviewer` | `architect` | `planner` | `code-reviewer` | `security-reviewer` |
| `{report_baseName}` | Output report file name prefix | `requirements-report` | `architecture-report` | `plan-report` | `code-review-report` | `security-review-report` |
| `{approval_category}` | 3rd argument to `record-approval.js` | `requirements` | `architecture` | `plan` | `code-review` | `security-review` |
| `{report_en_name}` | Report type name shown in approval confirmation message | `requirements definition report` | `architecture design report` | `plan report` | `code review report` | `security assessment report` |
| `{approval_target_en}` | The subject of "approve this ○○?" in the confirmation message | `report` | `design` | `plan` | `report` | `report` |
| `{request_summary}` | One-line request summary to the sub-agent | `Create requirements definition report` | `Create architecture design report` | `Create work plan report (plan-report)` | `Create code review report` | `Create security assessment report` |
| `{prompt_body}` | Command-specific Q&A results / upstream report paths / request body | (defined in the command) | (defined in the command) | (defined in the command) | (defined in the command) | (defined in the command) |
| `{extra_output_instructions}` | Additional line(s) in output instructions (optional; omit this line if not needed) | omit | omit | omit (planner keeps Step 4 inline) | omit | omit |

> **Note (planner)**: Because generating `plan-report` requires appending a large `## YAML frontmatter output rules` section **after** `## Output instructions`, planner **keeps Step 4 inline** and only references this common file for Steps 5-8.

---

## Step 4: Single-shot sub-agent launch

Launch with `subagent_type: {agent_type}` via the Agent tool. Include the following in the prompt:

```
## Work request
{request_summary}

{prompt_body}

## Output instructions
- Output destination: `.claude/reports/{report_baseName}-*.md` (via write-report.js)
{extra_output_instructions}
- The final message must include the report file path (format: `File: .claude/reports/{report_baseName}-YYYYMMDD-HHmmss.md`)
- Do not use AskUserQuestion / SendMessage
- Exit after generating the report (approval confirmation is handled by the parent Claude)
```

For regeneration after rejection, add the following to the prompt:
```
## Regeneration mode
- Previous report: {previous report path}
- User's revision instructions: {instructions}
```

## Step 5: Receive report path

Extract the report file path from the sub-agent's final output using the regex `.claude/reports/{report_baseName}-\d{8}-\d{6}\.md`.

## Step 6: Approval confirmation

Present the following to the user as text:

```
The {report_en_name} has been saved to `{file path}`. Please review the content — do you approve this {approval_target_en}? (yes / no)
If revisions are needed, please describe them.
```

## Step 7: Record approval

To prevent shell injection, pass the comment via a tmp file:

1. Run `node .claude/hooks/clear-tmp-file.js --path .claude/tmp/approval-comment.md`
2. Use the Write tool to save the user's approval comment to `.claude/tmp/approval-comment.md` (empty string if no comment)
3. Run:

```bash
node .claude/hooks/record-approval.js {filename} {yes|no} {approval_category} --comment-file .claude/tmp/approval-comment.md
```

## Step 8: Restart on rejection

If rejected, repeat from Step 4 with a new prompt that includes the revision instructions and the previous report path.
