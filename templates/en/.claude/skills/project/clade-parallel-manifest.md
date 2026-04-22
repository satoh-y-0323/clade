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

## Timeout decision matrix

| Agent | read_only | timeout_sec | idle_timeout_sec |
|---|---|---|---|
| worktree-developer | false | Adjust based on dev scale (increase if 900 is insufficient) | **Required** (guideline: 600, adjust as needed) |
| code-reviewer | true | Default (900) is usually sufficient | **Must not be set** |
| security-reviewer | true | Default (900) is usually sufficient | **Must not be set** |

## Common mistakes

| Mistake | Correct form |
|---|---|
| `read_only: "true"` | `read_only: true` |
| Setting idle_timeout_sec with read_only: true | Remove idle_timeout_sec |
| Not setting idle_timeout_sec for worktree-developer | Add `idle_timeout_sec: 600` or similar |
| Writing symlink-resolved physical paths in writes | Write the path exactly as it appears in the manifest |
