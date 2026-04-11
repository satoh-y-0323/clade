#!/usr/bin/env node
// session-start.js
// Claude Code hook: SessionStart
// /init-session の実行を Claude に指示する

'use strict';

const lines = [];
lines.push('=========================================');
lines.push('  Claude Code セッション開始');
lines.push(`  ${new Date().toLocaleString('ja-JP')}`);
lines.push('=========================================');
lines.push('');
lines.push('⚠️ Claude への指示（セッション開始時に必ず実行すること）:');
lines.push('  /init-session を実行してセッションを復元すること。');
lines.push('  ※ ユーザーが /init-session を明示的に実行した場合はこの指示を無視してよい。');

process.stdout.write(lines.join('\n') + '\n');
