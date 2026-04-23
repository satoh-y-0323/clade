# clade-parallel Manifest Rules (v0.5 and later)

Rules for writing clade-parallel YAML frontmatter in plan-reports.

## Field specifications

### timeout_sec
- Default: **900** (when omitted)
- Total execution time limit (seconds)
- Set based on the estimated duration of the parallel section. Can be omitted if the default is sufficient.

### idle_timeout_sec (new in v0.5)
- Default: **none** (optional)
- Forces the task to terminate if there is no stdout/stderr output for N seconds
- **Must be set for worktree-developer** (guideline: 600; adjust based on dev scale)
- **Must not be set** for `read_only: true` tasks (silently ignored at runtime with a stderr warning)

### read_only
- **Must be a YAML boolean** (`true` / `false`; string `"true"` is not valid)
- `read_only: true` — read-only agents such as code-reviewer and security-reviewer
- `read_only: false` — agents that write files, such as worktree-developer

### writes
- Declares the files this task will write
- **Write the path as-is in the manifest — do not resolve symlinks to their physical targets**
- Conflict detection is handled internally by clade-parallel
- Omit for `read_only: true` groups

### phase (optional)
- `phase: developer` — developer phase groups (implementation tasks with worktree)
- `phase: reviewer`  — reviewer phase groups (read-only review tasks)
- **When omitted**: treated as `phase: developer` (backward compatible)
- `--phase developer` filter: extracts groups with `phase: developer` or no phase specified
- `--phase reviewer` filter: extracts only groups with `phase: reviewer`

## Timeout decision matrix

| Agent | phase | read_only | timeout_sec | idle_timeout_sec |
|---|---|---|---|---|
| worktree-developer | developer (or omitted) | false | Adjust based on dev scale (increase if 900 is insufficient) | **Required** (guideline: 600, adjust as needed) |
| code-reviewer | reviewer | true | Default (900) is usually sufficient | **Must not be set** |
| security-reviewer | reviewer | true | Default (900) is usually sufficient | **Must not be set** |

## Common mistakes

| Mistake | Correct form |
|---|---|
| `read_only: "true"` | `read_only: true` |
| Setting idle_timeout_sec with read_only: true | Remove idle_timeout_sec |
| Not setting idle_timeout_sec for worktree-developer | Add `idle_timeout_sec: 600` or similar |
| Writing symlink-resolved physical paths in writes | Write the path exactly as it appears in the manifest |
| Omitting `phase:` for reviewer groups | Use `phase: reviewer` explicitly (omitting it treats the group as developer phase, excluding it from `--phase reviewer`) |
| Putting multiple rounds' groups in the same plan-report | The planner generates a new plan-report file per round (1 file = 1 round only) |

## Full workflow example (developer + reviewer phases in parallel)

Define both developer and reviewer groups in the same plan-report and execute them separately by phase:

```yaml
---
parallel_groups:
  # ---- developer phase (extracted with --phase developer) ----
  group-frontend:
    phase: developer       # can be omitted (developer is the default)
    agent: worktree-developer
    read_only: false
    tasks: [T1, T2]
    writes: ["src/frontend/**"]
    timeout_sec: 1800
    idle_timeout_sec: 600

  group-backend:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T3, T4]
    writes: ["src/backend/**"]
    timeout_sec: 1800
    idle_timeout_sec: 600

  # ---- reviewer phase (extracted with --phase reviewer) ----
  code-review-group:
    phase: reviewer        # required (omitting it treats it as developer phase)
    agent: code-reviewer
    read_only: true
    tasks: [review]
    timeout_sec: 900

  security-review-group:
    phase: reviewer
    agent: security-reviewer
    read_only: true
    tasks: [security]
    timeout_sec: 900
---
```

### Multi-round workflows

If the reviewer finds issues and a Round 2 is needed, the planner (Step 8) generates a **new plan-report file**. Write Round 2's `parallel_groups` in the new file — do not mix them with Round 1's groups.

```
Round 1: plan-report-20260423-100000.md → developer (parallel) → reviewer (parallel)
Round 2: plan-report-20260423-140000.md → developer (parallel) → reviewer (parallel)
```
