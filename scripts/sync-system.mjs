#!/usr/bin/env node
/**
 * sync-system — reports drift between this project's .claude/ and upstream.
 *
 * Copy-paste distribution fails because nobody can tell which copy is stale.
 * This makes divergence visible and one-command fixable.
 *
 *   node scripts/sync-system.mjs             # report only
 *   node scripts/sync-system.mjs --pull      # overwrite shared dirs from upstream
 *   node scripts/sync-system.mjs --upstream <path>
 *
 * Shared (overwritten by --pull):  core/ stack/ adapters/ profiles/ kits/
 * Project-owned (NEVER touched):   CLAUDE.md PROJECT.md memory/ roadmap/ settings.json
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, relative, dirname, sep, posix } from 'node:path';
import { createHash } from 'node:crypto';

const SHARED = ['core', 'stack', 'adapters', 'profiles', 'kits', 'design'];
const OWNED = ['CLAUDE.md', 'PROJECT.md', 'memory', 'roadmap', 'settings.json'];

const argv = process.argv.slice(2);
const pull = argv.includes('--pull');
const upstream =
  argv[argv.indexOf('--upstream') + 1] && !argv[argv.indexOf('--upstream') + 1].startsWith('--')
    ? argv[argv.indexOf('--upstream') + 1]
    : process.env.CLAUDE_SYSTEM_PATH ?? '../claude-system';

const local = '.claude';

if (!existsSync(upstream)) {
  console.error(`upstream not found: ${upstream}\nSet CLAUDE_SYSTEM_PATH or pass --upstream <path>.`);
  process.exit(1);
}

const walk = (dir, base = dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const f = join(dir, n);
    if (statSync(f).isDirectory()) walk(f, base, out);
    else out.push(relative(base, f).split(sep).join(posix.sep));
  }
  return out;
};

const hash = (f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 12);

const added = [], changed = [], removed = [];

for (const dir of SHARED) {
  const up = join(upstream, dir);
  const lo = join(local, dir);
  const upFiles = new Set(walk(up));
  const loFiles = new Set(walk(lo));

  for (const f of upFiles) {
    const a = join(up, f), b = join(lo, f);
    if (!loFiles.has(f)) added.push([join(dir, f), a, b]);
    else if (hash(a) !== hash(b)) changed.push([join(dir, f), a, b]);
  }
  for (const f of loFiles) if (!upFiles.has(f)) removed.push(join(dir, f));
}

const ver = (p) => (existsSync(p) ? readFileSync(p, 'utf8').trim() : 'unknown');
const upVer = ver(join(upstream, 'VERSION'));
const loVer = ver(join(local, '.system-version'));

console.log(`system  local ${loVer}  →  upstream ${upVer}`);

if (!added.length && !changed.length && !removed.length) {
  console.log('in sync — no drift in shared directories.');
  process.exit(0);
}

const list = (label, items) => {
  if (items.length) {
    console.log(`\n${label} (${items.length})`);
    for (const it of items.slice(0, 30)) console.log(`  ${Array.isArray(it) ? it[0] : it}`);
    if (items.length > 30) console.log(`  … ${items.length - 30} more`);
  }
};

list('new upstream', added);
list('locally modified or upstream-updated', changed);
list('local-only (NOT removed by --pull)', removed);

if (!pull) {
  console.log(`\nRun with --pull to overwrite shared dirs from upstream.`);
  console.log(`Project-owned files are never touched: ${OWNED.join(', ')}`);
  process.exit(1);
}

for (const [relPath, src, dest] of [...added, ...changed]) {
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`  pulled  ${relPath}`);
}
writeFileSync(join(local, '.system-version'), `${upVer}\n`);
console.log(`\nsynced to ${upVer}. Local-only files left in place.`);
console.log('Review the diff before committing — a locally modified core/ file was just overwritten.');
