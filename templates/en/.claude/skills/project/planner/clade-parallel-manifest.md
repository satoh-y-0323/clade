# clade-parallel Manifest Rules (v0.5 and later)

Rules for writing clade-parallel YAML frontmatter in plan-reports.

## Field specifications

### timeout_sec
- Default: **900** (ultimate fallback when omitted)
- Total execution time limit (seconds)
- Normally auto-resolved from `phase_scales` — no need to write directly. Only write per-group if individual adjustment is needed (group direct value takes priority over `phase_scales`)

### idle_timeout_sec (new in v0.5)
- Default: **none** (optional)
- Forces the task to terminate if there is no stdout/stderr output for N seconds
- **Should be set for worktree-developer** (auto-resolved from `phase_scales` — no need to write directly)
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

Specifying a scale in `phase_scales` lets `plan-to-manifest.js` resolve timeouts automatically. Direct values are only for individual group adjustments.

### developer phase (worktree-developer)

| scale | timeout_sec | idle_timeout_sec | Scenario |
|---|---|---|---|
| small  | 3000 (50 min)  | 2400 (40 min) | Minimum parallelization threshold. 3–4 files, single feature |
| medium | 6000 (100 min) | 3600 (60 min) | Standard parallel implementation (default). Spans multiple features |
| large  | 12000 (200 min)| 4800 (80 min) | Multiple subsystems in parallel, large-scale refactor |

### reviewer phase (code-reviewer / security-reviewer)

`idle_timeout_sec` **must not be set** (runner.py forces it to None for read_only tasks).

| scale | timeout_sec | Scenario |
|---|---|---|
| small  | 3000 (50 min)  | Small-scale review |
| medium | 9000 (150 min) | Standard review (default) |
| large  | 45000 (750 min)| Large-scale, wide-ranging review |

## Common mistakes

| Mistake | Correct form |
|---|---|
| `read_only: "true"` | `read_only: true` |
| Setting idle_timeout_sec with read_only: true | Remove idle_timeout_sec |
| Writing timeout_sec / idle_timeout_sec directly for worktree-developer | Use `phase_scales` to auto-resolve (only write directly for individual group adjustment) |
| Writing symlink-resolved physical paths in writes | Write the path exactly as it appears in the manifest |
| Omitting `phase:` for reviewer groups | Use `phase: reviewer` explicitly (omitting it treats the group as developer phase, excluding it from `--phase reviewer`) |
| Putting multiple rounds' groups in the same plan-report | The planner generates a new plan-report file per round (1 file = 1 round only) |

## Full workflow example (developer + reviewer phases in parallel)

Define both developer and reviewer groups in the same plan-report and execute them separately by phase:

```yaml
---
phase_scales:
  developer: medium   # small: 50min/40min idle  medium: 100min/60min idle  large: 200min/80min idle
  reviewer: small     # small: 50min  medium: 150min  large: 750min

parallel_groups:
  # ---- developer phase (extracted with --phase developer) ----
  group-frontend:
    phase: developer       # can be omitted (developer is the default)
    agent: worktree-developer
    read_only: false
    tasks: [T1, T2]
    writes: ["src/frontend/**"]
    # timeout_sec / idle_timeout_sec are auto-resolved from phase_scales (no need to write)

  group-backend:
    phase: developer
    agent: worktree-developer
    read_only: false
    tasks: [T3, T4]
    writes: ["src/backend/**"]

  # ---- reviewer phase (extracted with --phase reviewer) ----
  code-review-group:
    phase: reviewer        # required (omitting it treats it as developer phase)
    agent: code-reviewer
    read_only: true
    tasks: [review]
    # timeout_sec is auto-resolved from phase_scales. idle_timeout_sec must not be set.

  security-review-group:
    phase: reviewer
    agent: security-reviewer
    read_only: true
    tasks: [security]
---
```

### Multi-round workflows

If the reviewer finds issues and a Round 2 is needed, the planner (Step 8) generates a **new plan-report file**. Write Round 2's `parallel_groups` in the new file — do not mix them with Round 1's groups.

```
Round 1: plan-report-20260423-100000.md → developer (parallel) → reviewer (parallel)
Round 2: plan-report-20260423-140000.md → developer (parallel) → reviewer (parallel)
```
