#!/usr/bin/env node
// session-start.js
// Claude Code hook: SessionStart
// Instructs Claude to run /init-session

'use strict';

const lines = [];
lines.push('=========================================');
lines.push('  Claude Code Session Start');
lines.push(`  ${new Date().toLocaleString('en-US')}`);
lines.push('=========================================');
lines.push('');
lines.push('⚠️ Instruction for Claude (must execute at session start):');
lines.push('  Run /init-session to restore the session state.');
lines.push('  * If the user explicitly ran /init-session, this instruction may be ignored.');

process.stdout.write(lines.join('\n') + '\n');
