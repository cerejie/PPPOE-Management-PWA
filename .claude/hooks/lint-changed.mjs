#!/usr/bin/env node
/**
 * PostToolUse hook — structure-lints the single file just written.
 *
 * Feeds violations back to Claude immediately, while the file is still the
 * active subject, instead of at review time when the context has moved on.
 * This is the mechanism behind conformance level L1 ("new code conforms"):
 * a file Claude just touched is held to the TARGET level, not the declared one.
 *
 * Exit 2 = surface stderr to Claude as a correction. Never blocks the write
 * itself — the file is already on disk; this is a nudge, not a gate.
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let file = '';
try {
  file = JSON.parse(raw || '{}')?.tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

if (!/\.tsx?$/.test(file) || !file.includes('src')) process.exit(0);
if (!existsSync('scripts/structure-lint.mjs')) process.exit(0);

const target =
  (existsSync('.claude/PROJECT.md') &&
    readFileSync('.claude/PROJECT.md', 'utf8').match(/^\s*target:\s*(L[0-6])/m)?.[1]) || 'L5';

let out = '';
try {
  execFileSync('node', ['scripts/structure-lint.mjs', '--level', target, '--json'], {
    encoding: 'utf8',
  });
  process.exit(0); // clean
} catch (e) {
  out = e.stdout ?? '';
}

let findings = [];
try {
  findings = JSON.parse(out).findings ?? [];
} catch {
  process.exit(0);
}

const norm = file.replace(/\\/g, '/');
const mine = findings.filter((f) => norm.endsWith(f.file));
if (mine.length === 0) process.exit(0);

console.error(
  `structure-lint (${target}) on the file you just wrote:\n` +
    mine.map((f) => `  ${f.file}:${f.line}  [${f.rule}] ${f.message}`).join('\n') +
    `\nFix these now — new code is held to the target level.`
);
process.exit(2);
