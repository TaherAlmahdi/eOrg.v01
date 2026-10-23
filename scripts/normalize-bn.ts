// scripts/normalize-bn.ts
// Rewrites text files so the Bengali nukta letters use one spelling (য় ড় ঢ় as single code points).
//   npm run normalize-bn          -> dry run: lists the files that would change
//   npm run normalize-bn:write    -> rewrites them
// Extra folders (e.g. the book repo's content/) can be added with CONTENT_ROOT or as arguments.
import fs from 'node:fs';
import path from 'node:path';
import { normalizeBn } from '../app/lib/bn-text';

const WRITE = process.argv.includes('--write');
const EXTENSIONS = new Set(['.md', '.ts', '.tsx', '.mjs', '.js', '.json', '.css', '.sql']);
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.open-next', '.wrangler']);
const SKIP_FILES = new Set(['package-lock.json']);

const roots = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (process.env.CONTENT_ROOT) roots.push(process.env.CONTENT_ROOT);
if (roots.length === 0 || !roots.some((r) => path.resolve(r) === process.cwd())) roots.unshift('.');

let scanned = 0;
const changed: string[] = [];

function visit(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) visit(full);
    } else if (EXTENSIONS.has(path.extname(entry.name)) && !SKIP_FILES.has(entry.name)) {
      scanned++;
      const text = fs.readFileSync(full, 'utf8');
      const fixed = normalizeBn(text);
      if (fixed === text) continue;
      changed.push(full);
      if (WRITE) fs.writeFileSync(full, fixed, 'utf8');
    }
  }
}

const seen = new Set<string>();
for (const root of roots) {
  const abs = path.resolve(root);
  if (seen.has(abs) || !fs.existsSync(abs)) continue;
  seen.add(abs);
  visit(abs);
}

console.log(`${WRITE ? 'Rewrote' : 'Would rewrite'} ${changed.length} of ${scanned} files.`);
if (!WRITE) changed.slice(0, 20).forEach((f) => console.log(' ', f));
