# Playwright MCP Skill

## Overview

Microsoft's Playwright MCP server. Lets Claude drive a browser directly (clicks, input, screenshots, page navigation, etc.).
Primarily used for E2E testing, behavior verification, and debugging of locally running web apps during development.

## Security settings

In this project, the `--allowed-origins` option restricts the browser to **localhost only**.

```
--allowed-origins "http://localhost:*;https://localhost:*;http://127.0.0.1:*;https://127.0.0.1:*"
```

### Intent of the restriction
- Since this is a development / testing tool, unintended access to external sites is blocked
- Narrowing usage to local web apps eliminates the risk of accidentally sending data to external services
- If external access is required, temporarily change `--allowed-origins` in `settings.json` (and restore it afterward)

### Notes
- `--allowed-origins` does not apply to redirect targets (per official spec)
- This is not a complete security boundary; do not use it for sensitive operations

## Available tools

| Tool name | Description | When to use |
|---|---|---|
| `browser_navigate` | Navigate to a URL | Open a local app page |
| `browser_click` | Click an element | Button / link operations |
| `browser_type` | Type text | Fill in forms |
| `browser_snapshot` | Take an accessibility snapshot | Inspect page structure (lightweight) |
| `browser_take_screenshot` | Take a screenshot | Visually inspect the UI |
| `browser_wait_for` | Wait for an element or text to appear | Check async UI |
| `browser_select_option` | Select an option from a dropdown | Dropdown operations |
| `browser_check` / `browser_uncheck` | Operate checkboxes | Form operations |
| `browser_hover` | Hover over an element | Check tooltips / dropdown menus |
| `browser_press_key` | Press a key | Enter / Tab / Esc etc. |
| `browser_go_back` / `browser_go_forward` | Browser history navigation | Check previous / next pages |
| `browser_tab_new` | Open a new tab | Work across multiple pages |
| `browser_close` | Close the browser | Cleanup after operations |

## How to use in this project

### Typical use cases

1. **Verify a local development server**
   ```
   "Open http://localhost:3000, fill the login form with a test ID and password, click the login button, and tell me the destination URL and page title."
   ```

2. **Screenshot after UI changes**
   ```
   "Take a screenshot of http://localhost:3000/dashboard."
   ```

3. **Form validation check**
   ```
   "Open http://localhost:3000/register, enter an invalid value (abc) in the email field, submit, and check whether an error message is displayed."
   ```

4. **Validate E2E test scenarios**
   ```
   "On http://localhost:3000 do the following and report the results: 1) Open the top page 2) Click 'Products' in navigation 3) Click the first product 4) Click 'Add to cart' 5) Verify the cart icon badge shows 1"
   ```

## Required environment variables

None (no API key required)

## Launch configuration (for reference)

The following is already configured in `.claude/settings.json`:

```json
"playwright": {
  "command": "npx",
  "args": [
    "-y",
    "@playwright/mcp@latest",
    "--allowed-origins",
    "http://localhost:*;https://localhost:*;http://127.0.0.1:*;https://127.0.0.1:*"
  ]
}
```

## When external access is required

To access external sites (e.g., staging or production verification), change `--allowed-origins` in `settings.json`.

```json
"args": [
  "-y",
  "@playwright/mcp@latest"
]
```

After changing, restart Claude Code to apply the settings. Always restore the localhost-only setting once the work is complete.
