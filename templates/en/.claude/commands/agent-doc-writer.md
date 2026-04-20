# /agent-doc-writer command

Starts the document writer agent (doc-writer). The parent Claude handles Q&A with the user, then launches the sub-agent in a single shot to generate the document.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent is launched in a single shot after Q&A is complete.

## Execution flow

### Step 1: Read upstream reports (as needed)

Review existing related files or documents as needed.
Usually skip to Step 2, since the target is identified through Q&A with the user.

### Step 2: Q&A

Output the following questions one by one as text and wait for the user's response (output one question at a time, then proceed after receiving the answer).

**Q1: What to create**

```
What kind of document would you like to create?

  [mermaid]   Mermaid diagram (flowchart, class diagram, ER diagram, sequence diagram, etc.)
  [readme]    README (project overview, setup instructions, usage)
  [manual]    Operation or runbook (screen operation, command procedures, etc.)
  [api]       API specification (endpoints, request/response definitions)
  [spec]      Specification document (reverse-engineering from existing code)
  [other]     Other (free text)
```

**Q2: Target file or directory**

```
Please tell me the target file or directory.
(e.g., src/batch/HogeProcessor.cs, all files under src/services/, etc.)
```

After receiving the answer, confirm the target using Glob/Grep/Read.
If the target is broad, ask: "Found X files. Should all of them be included?"

**Q3: Audience**

```
Who will read this document?

  [dev-new]   New developer team members (just starting to read the code)
  [dev-team]  Existing developer team members (for sharing or handover)
  [ops]       Operations and maintenance staff (engineers who don't write code)
  [biz]       Business stakeholders or non-engineers (system users or administrators)
  [external]  External reviewers, clients, or sponsors
  [other]     Other (free text)
```

**Q4: Purpose**

```
What is the purpose of creating this document?

  [overview]  For overall understanding / first-time onboarding
  [handover]  For handover or role transition
  [review]    For obtaining reviews or approvals
  [trouble]   For investigating or responding to incidents
  [onboard]   For onboarding new team members
  [other]     Other (free text)
```

**Q5: Granularity** (required for Mermaid diagrams, optional for others)

Ask when Mermaid is selected or when "how detailed" is important:

```
At what level of granularity should it be described?

  [high]    High level (module/service level; the overall flow is visible at a glance)
  [mid]     Mid level (class/function level; key process connections are visible)
  [low]     Low level (method/field level; detailed implementation is visible)
```

**Q6: Output destination**

```
Where should the document be saved?

  [reports]  .claude/reports/doc-{name}.md (temporary storage, treated as a report)
  [project]  A specified path within the project (e.g., docs/architecture.md)
  [show]     Display here only, do not save to a file
```

**Q7: Final confirmation**

```
I will create the document with the following details. Is that okay?

- Type: {Q1 answer}
- Target: {Q2 answer}
- Audience: {Q3 answer}
- Purpose: {Q4 answer}
- Granularity: {Q5 answer (if applicable)}
- Output destination: {Q6 answer}

If okay, answer "yes". If there are changes, please describe them.
```

### Step 3: Organize Q&A results

Organize the user's answers into the following structure:
- Document type
- Target files/directories (including actual paths confirmed via Glob)
- Audience
- Purpose
- Granularity
- Output path

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: doc-writer` via the Agent tool. Include the following in the prompt:

```
## Work request
Generate document

## Q&A results with user

### Q1: Document type
A: {answer}

### Q2: Target file/directory
A: {answer}
Confirmed file list: {file list from Glob}

### Q3: Audience
A: {answer}

### Q4: Purpose
A: {answer}

### Q5: Granularity
A: {answer (if applicable)}

### Q6: Output destination
A: {answer}
Output path: {specific path}

## Output instructions
- Output destination: {path specified in Q6} (write directly using the Write tool)
- If [show] is specified, do not save to a file; include the document body in the final message
- Do not use AskUserQuestion / SendMessage
- Exit after generating the document (confirmation is handled by the parent Claude)
- The final message must include the generated file path (or "display only")
```

For regeneration after rejection, add the following to the prompt:
```
## Regeneration mode
- User's revision instructions: {instructions}
```

### Step 5: Receive results

Confirm the generated file path from the sub-agent's final output.
For `[show]`, review the document body.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The document has been generated.

Saved to: {path or "display only"}
Type:     {type}
Target:   {target file/directory}

Are there any sections that need revision?
  [ok]     Complete as-is
  [fix]    Revise (please describe the changes)
  [redo]   Redo with different granularity, target, or structure
```

### Step 7: Record approval

Since doc-writer may not always generate a report file, recording approval is optional.
If saved to `.claude/reports/doc-*.md`, run the following:

```bash
node .claude/hooks/record-approval.js {filename} {yes|no} doc "{comment}"
```

### Step 8: Restart on rejection

If `fix` or `redo`, repeat from Step 4 with a new prompt that includes the revision instructions.

---

## Purpose
- Generating Mermaid diagrams (flowcharts, class diagrams, ER diagrams, sequence diagrams)
- Creating or updating README files
- Writing operation manuals and runbooks
- Creating API specifications
- Reverse-engineering specifications from existing code

## Notes
- Operates independently from the standard workflow (phases)
- This command is self-contained (no handoff to other agents)
- Does not modify source code
