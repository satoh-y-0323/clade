# /context-gauge Command

Toggle the context usage gauge.
Check the current state and disable it if enabled, or enable it if disabled.

## Steps

1. Read `.claude/settings.local.json` using the Read tool
2. Branch based on whether the `statusLine` key exists:

### If `statusLine` exists (-> disable)

Use the Edit tool to delete the entire `statusLine` block.
Make sure to delete it along with surrounding commas so the JSON remains valid.

Example block to delete:
```json
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/statusline.js"
  }
```

After completion, say: "The context gauge has been **disabled**. Restart Claude Code for the change to take effect."

### If `statusLine` does not exist (-> enable)

Use the Edit tool to add the following just before the closing `}` at the end of `settings.local.json`:

```json
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/statusline.js"
  }
```

After completion, say: "The context gauge has been **enabled**. Restart Claude Code for the change to take effect."

## How to Read the Gauge

Display format varies by plan:

**With rate_limits data (Pro, Max, etc.):**
```
context usage: [█████░░░░░] 50%  5hour limits: [███░░░░░░░] 30% 2h 15m  7day limits: [██░░░░░░░░] 20% 5d 3h
```

**Without rate_limits data (Enterprise, etc.):**
```
context usage: [█████░░░░░] 50%
```

- 10 cells total; 1 cell = 10%
- Filled blocks (left) = used, dim blocks (right) = remaining
- Number color: green up to 60%, yellow above 60%, orange above 75%, red above 90%
- Reset time shown as `Xh Xm` (hours/minutes) or `Xd Xh` (days/hours)
