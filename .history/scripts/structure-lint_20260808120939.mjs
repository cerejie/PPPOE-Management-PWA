#!/usr/bin/env node
/**
 * structure-lint — makes the project-structure standard machine-checkable.
 *
 * Runs only the rules for the conformance level declared in .claude/PROJECT.md,
 * so an adopting project gets a green build at every rung of the ladder.
 *
 *   node scripts/structure-lint.mjs             # lint at declared level
 *   node scripts/structure-lint.mjs --level L5  # preview a higher rung
 *   node scripts/structure-lint.mjs --changed   # only files changed vs HEAD
 *   node scripts/structure-lint.mjs --json
 *
 * Zero dependencies by design: it must run before `yarn install` finishes.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname, sep, posix } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const onlyChanged = argv.includes('--changed');
const levelArg = argv[argv.indexOf('--level') + 1];

const LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

/** Backend SDKs that may only appear inside src/api/adapters/. Extend per project. */
const BACKEND_SDKS = [
  '@supabase/', 'axios', 'firebase', '@aws-sdk/', 'mongodb',
  '@prisma/client', 'mysql2', 'pg', '@azure/',
];

const LIMITS = { component: 250, fn: 50 };

// ── config ───────────────────────────────────────────────────────────────────

function readDeclaredLevel() {
  const p = join(ROOT, '.claude', 'PROJECT.md');
  if (!existsSync(p)) return 'L1';
  const m = readFileSync(p, 'utf8').match(/^\s*conformance:\s*(L[0-6])/m);
  return m ? m[1] : 'L1';
}

const level = LEVELS.includes(levelArg) ? levelArg : readDeclaredLevel();
const rank = LEVELS.indexOf(level);
const at = (l) => rank >= LEVELS.indexOf(l);

// ── file collection ──────────────────────────────────────────────────────────

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(name))) out.push(full);
  }
  return out;
}

function changedFiles() {
  try {
    const base = execSync('git merge-base HEAD origin/HEAD 2>/dev/null || git rev-parse HEAD~1', {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return execSync(`git diff --name-only ${base}`, { encoding: 'utf8' })
      .split('\n').filter(Boolean).map((f) => join(ROOT, f))
      .filter((f) => existsSync(f) && ['.ts', '.tsx'].includes(extname(f)));
  } catch {
    return walk(SRC);
  }
}

const files = onlyChanged ? changedFiles() : walk(SRC);
const findings = [];
const rel = (f) => relative(ROOT, f).split(sep).join(posix.sep);

function report(file, line, rule, message) {
  findings.push({ file: rel(file), line, rule, message });
}

// ── rules ────────────────────────────────────────────────────────────────────

const IMPORT_RE = /^\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/;

for (const file of files) {
  const r = rel(file);
  if (!r.startsWith('src/')) continue;

  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const isStyle = r.endsWith('.css.ts');
  const inAdapters = r.startsWith('src/api/adapters/');

  lines.forEach((raw, i) => {
    const n = i + 1;
    const m = raw.match(IMPORT_RE);
    const spec = m?.[1];

    // L2 — alias discipline
    if (at('L2') && spec?.startsWith('../')) {
      report(file, n, 'L2/relative-import',
        `Cross-folder relative import "${spec}" — use the @/ alias.`);
    }

    // L3 — backend confined to adapters
    if (at('L3') && spec && !inAdapters) {
      const sdk = BACKEND_SDKS.find((s) => spec === s.replace(/\/$/, '') || spec.startsWith(s));
      if (sdk) {
        report(file, n, 'L3/sdk-escape',
          `Backend SDK "${spec}" imported outside src/api/adapters/. Go through a port.`);
      }
    }

    // L4 — honest types
    if (at('L4') && !isStyle) {
      if (/(:|<)\s*any\b|\bas\s+any\b/.test(raw) && !raw.trimStart().startsWith('//')) {
        report(file, n, 'L4/any', 'Explicit `any` — use `unknown` plus narrowing.');
      }
      if (raw.includes('@ts-ignore')) {
        report(file, n, 'L4/ts-ignore', 'Use `@ts-expect-error` with a reason instead.');
      }
    }

    // L5 — layout and export discipline
    if (at('L5')) {
      if (/^\s*export\s+default\b/.test(raw)) {
        report(file, n, 'L5/default-export', 'Named exports only.');
      }
      if (spec) {
        if (r.startsWith('src/common/') && /^@\/(components|pages|services|hooks|stores)\//.test(spec)) {
          report(file, n, 'L5/common-depends-on-module',
            `common/ must not import a module ("${spec}").`);
        }
        if (r.startsWith('src/api/') && spec.startsWith('@/stores/')) {
          report(file, n, 'L5/api-depends-on-store',
            'api/ must not import stores/. Transport knows nothing about state.');
        }
        if (spec.startsWith('@/pages/') && !r.startsWith('src/pages/') && !r.startsWith('src/routes/')) {
          report(file, n, 'L5/imports-pages', 'Nothing outside routes/ imports pages/.');
        }
      }
    }
  });

  // L5 — stylesheets live only under src/styles/
  if (at('L5') && isStyle && !r.startsWith('src/styles/')) {
    report(file, 1, 'L5/style-location',
      'A .css.ts must live under src/styles/ mirroring its component path.');
  }

  // L5 — size limits
  if (at('L5') && !isStyle) {
    if (r.endsWith('.tsx') && lines.length > LIMITS.component) {
      report(file, lines.length, 'L5/component-size',
        `${lines.length} lines > ${LIMITS.component}. Extract a hook or sub-view.`);
    }
    let start = null, depth = 0;
    lines.forEach((raw, i) => {
      if (start === null && /(function\s+\w+|=>\s*\{|\)\s*\{)\s*$/.test(raw)) { start = i; depth = 0; }
      if (start !== null) {
        depth += (raw.match(/\{/g) ?? []).length - (raw.match(/\}/g) ?? []).length;
        if (depth <= 0 && i > start) {
          if (i - start > LIMITS.fn) {
            report(file, start + 1, 'L5/function-size',
              `Function spans ${i - start} lines > ${LIMITS.fn}.`);
          }
          start = null;
        }
      }
    });
  }
}

// L5 — every component has its mirrored stylesheet slot available
if (at('L5') && !onlyChanged && existsSync(SRC)) {
  for (const f of files) {
    const r = rel(f);
    if (!r.endsWith('.css.ts') || !r.startsWith('src/styles/')) continue;
    const tail = r.replace(/^src\/styles\/(pages|features|common|app|global)\//, '');
    if (r.includes('/global/')) continue;
    const candidates = ['components', 'pages', 'common/components', 'app/layouts']
      .map((t) => join(SRC, t, tail.replace(/\.css\.ts$/, '.tsx')));
    if (!candidates.some(existsSync)) {
      report(f, 1, 'L5/orphan-stylesheet', 'No component matches this stylesheet path.');
    }
  }
}

// ── output ───────────────────────────────────────────────────────────────────

if (asJson) {
  console.log(JSON.stringify({ level, count: findings.length, findings }, null, 2));
} else if (findings.length === 0) {
  console.log(`structure-lint: clean at ${level} (${files.length} files)`);
} else {
  const byRule = findings.reduce((a, f) => ((a[f.rule] ??= []).push(f), a), {});
  for (const [rule, items] of Object.entries(byRule).sort()) {
    console.log(`\n  ${rule}  (${items.length})`);
    for (const f of items.slice(0, 20)) console.log(`    ${f.file}:${f.line}  ${f.message}`);
    if (items.length > 20) console.log(`    … ${items.length - 20} more`);
  }
  console.log(`\nstructure-lint: ${findings.length} finding(s) at ${level}\n`);
}

process.exit(findings.length > 0 ? 1 : 0);
