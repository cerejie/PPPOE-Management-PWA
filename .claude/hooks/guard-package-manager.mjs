#!/usr/bin/env node
/**
 * PreToolUse hook — blocks non-Yarn package managers before the command runs.
 *
 * Replaces three paragraphs of prose across three files with one mechanical
 * control. A rule that CAN be enforced by the harness must never be left to
 * the model remembering it at turn 200.
 *
 * Wire in .claude/settings.json:
 *   hooks.PreToolUse[matcher="Bash"].hooks[] →
 *     { "type": "command", "command": "node .claude/hooks/guard-package-manager.mjs" }
 *
 * Exit 2 = block and feed stderr back to Claude as a correction.
 */
let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let cmd = '';
try {
  cmd = JSON.parse(raw || '{}')?.tool_input?.command ?? '';
} catch {
  process.exit(0); // malformed payload must never block real work
}

// Strip quoted strings so `git commit -m "drop npm"` is not a false positive.
const scrubbed = cmd.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');

const BANNED = [
  { re: /(^|[\s;&|(])npm\s+(i|install|ci|run|exec|add|test|publish|update)\b/, name: 'npm' },
  { re: /(^|[\s;&|(])npx\s+/, name: 'npx' },
  { re: /(^|[\s;&|(])pnpm\s+/, name: 'pnpm' },
  { re: /(^|[\s;&|(])bun\s+(i|install|run|add|test|x)\b/, name: 'bun' },
];

const EQUIVALENT = {
  npm: 'npm install → yarn · npm install X → yarn add X · npm run X → yarn X · npm ci → yarn install --frozen-lockfile',
  npx: 'npx X → yarn dlx X (Berry) or yarn X when it is a project binary',
  pnpm: 'pnpm X → yarn X',
  bun: 'bun X → yarn X',
};

const hit = BANNED.find((b) => b.re.test(scrubbed));
if (hit) {
  console.error(
    `BLOCKED: this project is Yarn-only, and "${hit.name}" would desynchronise yarn.lock.\n` +
    `${EQUIVALENT[hit.name]}\n` +
    `Rewrite the command using Yarn and try again.`
  );
  process.exit(2);
}

// A package-lock.json must never be created.
if (/package-lock\.json/.test(scrubbed) && /(>|touch|cp|mv)/.test(scrubbed)) {
  console.error('BLOCKED: package-lock.json must never exist in a Yarn project.');
  process.exit(2);
}

process.exit(0);
