#!/usr/bin/env node
// Context gauge statusline script
// Displays a health-bar style context usage gauge

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => (raw += chunk));
process.stdin.on('end', () => {
  let pct = 0;
  try {
    const data = JSON.parse(raw);
    pct = Math.round(data?.context_window?.used_percentage ?? 0);
  } catch {
    // fallback to 0 if parsing fails
  }

  const TOTAL_CELLS = 10;
  const redCells = Math.min(Math.floor(pct / 10), TOTAL_CELLS);
  const greenCells = TOTAL_CELLS - redCells;

  // ANSI color codes
  const GREEN  = '\x1b[32m';
  const RED    = '\x1b[31m';
  const YELLOW = '\x1b[33m';
  const ORANGE = '\x1b[38;5;208m';
  const WHITE  = '\x1b[97m';
  const DIM    = '\x1b[2m';
  const RESET  = '\x1b[0m';

  const BLOCK = '█';
  const BRACKET_L = DIM + '[' + RESET;
  const BRACKET_R = DIM + ']' + RESET;

  // Build gauge: green cells (left) + red cells (right)
  const gauge =
    BRACKET_L +
    GREEN + BLOCK.repeat(greenCells) +
    RED   + BLOCK.repeat(redCells) +
    RESET +
    BRACKET_R;

  // Percentage text color
  let pctColor;
  if (pct > 90)      pctColor = RED;
  else if (pct > 75) pctColor = ORANGE;
  else if (pct > 60) pctColor = YELLOW;
  else               pctColor = WHITE;

  const label = pctColor + pct + '%' + RESET;

  process.stdout.write(gauge + ' ' + label + '\n');
});
