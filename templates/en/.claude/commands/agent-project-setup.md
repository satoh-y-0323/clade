# /agent-project-setup command

Starts the project setup agent (project-setup). The parent Claude handles the Q&A (interview) with the user, then launches the sub-agent in a single shot to generate coding-conventions.md.

## Parent Claude's responsibility

This command is executed directly by the parent Claude. The sub-agent only handles file generation.

## Execution flow

### Step 1: Check for existing settings (as needed)

Search for `.claude/skills/project/coding-conventions.md` using Glob.
If found, read the content and confirm with the user "Would you like to update this?" before proceeding with Q&A.
If not found, proceed directly to Step 2.

### Step 2: Q&A

Conduct the following interview questions one by one (output one question at a time as text and wait for the answer before proceeding).

**Step 2-1: Programming languages**

```
What programming language(s) does this project use?
If there are multiple, please list all of them.

Examples: TypeScript, Python, Go, C#, Java, Ruby, etc.
```

**Step 2-2: Present standard conventions**

After receiving the answer, present information on the standard coding conventions for each language (if WebSearch is unavailable, organize known information):

```
Here is a summary of the main coding conventions for {language name}:

--- Standard convention summary ---
{List the key rules for naming, indentation, file structure, etc. as bullet points}

This will be used as the baseline.
```

**Step 2-3: Custom rules (additions)**

```
Are there any custom rules you'd like to add on top of the standard conventions?
(Company-specific, team-specific, or personal preferences)
If none, answer "none."
```

**Step 2-4: Custom rules (exclusions / changes)**

```
Are there any standard convention rules you don't want to use or want to change?
If none, answer "none."
```

**Step 2-5: Comment language**

```
What language should comments be written in?
- English
- Japanese
- Either is fine
```

**Step 2-6: Confirm settings**

Organize the interview results and present them to the user for confirmation:

```
I will create coding-conventions.md with the following settings:

Language(s): {language list}
Base conventions: {adopted standard convention name}
Custom additions: {summary of custom rules}
Exclusions / changes: {excluded or changed standard rules}
Comment language: {language}

Is this correct? (yes / no)
If there are corrections, please describe them.
```

### Step 3: Organize Q&A results

Organize the user's answers into the following structure:
- List of programming languages
- Name of adopted standard conventions
- Custom rules to add
- Rules to exclude or change
- Comment language

### Step 4: Single-shot sub-agent launch

Launch with `subagent_type: project-setup` via the Agent tool. Include the following in the prompt:

```
## Work request
Generate coding conventions file (coding-conventions.md)

## Existing file path (for updates)
{path or "none (new creation)"}

## Q&A results with user

### Programming languages
{language list}

### Adopted standard conventions
{convention name and overview}

### Custom rules to add
{content or none}

### Rules to exclude or change
{content or none}

### Comment language
{English / Japanese / Either is fine}

## Output instructions
- Output destination: `.claude/skills/project/coding-conventions.md` (via write-file.js)
- Do not use AskUserQuestion / SendMessage
- Exit after generating the file (completion report is handled by the parent Claude)
- The final message must include the generated file path
```

For regeneration after rejection, add the following to the prompt:
```
## Regeneration mode
- User's revision instructions: {instructions}
```

### Step 5: Receive results

Confirm the file path from the sub-agent's final output.

### Step 6: Approval confirmation

Present the following to the user as text:

```
The coding conventions setup is complete.

.claude/skills/project/coding-conventions.md has been created.

This file will be automatically referenced by the following agents at the start of each task:
- /agent-developer   (convention compliance during implementation)
- /agent-code-reviewer (convention-based review)
- /agent-tester      (reflected in test naming and structure)
- /agent-architect   (reflected in language and pattern selection)

Please review the content — is this setup okay? (yes / no)
If revisions are needed, please describe them.
```

### Step 7: Record approval

Since project-setup does not generate a fixed report file, recording approval is omitted.

### Step 8: Restart on rejection

If rejected, repeat from Step 4 with a new prompt that includes the revision instructions.

---

## Purpose
- Configuring coding conventions at project start
- Updating or adding conventions (incorporating company-specific rules, etc.)
- Re-configuring conventions when languages change or are added

## Generated files
`.claude/skills/project/coding-conventions.md`

## Notes
- Operates independently from the standard workflow (phases)
- This command is self-contained (no handoff to other agents)
- It is recommended to run this once at project start
