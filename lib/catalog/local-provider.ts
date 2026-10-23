// lib/catalog/local-provider.ts
// Dev-only stand-in for the R2 bucket: serves the books from a local folder (the books repo)
// so new books can be checked in `next dev` before they are synced to R2.
// This is the only runtime file that touches fs, and it is loaded only when
// NODE_ENV === 'development' and CONTENT_ROOT is set (see app/lib/books/r2.ts).
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCatalogFromFiles, buildTocManifests, type CatalogFile } from './build';
import { normalizeBn } from '../../app/lib/bn-text';

const BOOKS_MANIFEST_KEY = '_manifest/books-index.json';
const ITEMS_MANIFEST_KEY = '_manifest/items-index.json';
const SLUGS_MANIFEST_KEY = '_manifest/slugs.json';
const TOC_MANIFEST_PREFIX = '_manifest/toc/';
const MANIFEST_TTL_MS = 3000;

const contentRoot = () => path.resolve(process.env.CONTENT_ROOT || '');
const coverRoot = () => (process.env.COVER_ROOT ? path.resolve(process.env.COVER_ROOT) : '');

async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const toKey = (root: string, file: string, prefix = '') =>
  prefix + path.relative(root, file).split(path.sep).join('/');

/** Resolve an R2-style key to a file on disk (null if outside the roots). */
function resolveKey(key: string): string | null {
  const isCover = key.startsWith('cover/');
  const root = isCover ? coverRoot() : contentRoot();
  if (!root) return null;
  const full = path.resolve(root, isCover ? key.slice('cover/'.length) : key);
  return full.startsWith(root + path.sep) || full === root ? full : null;
}

// Per-file cache keyed by path + mtime: after the first build only changed files are re-read.
// Only the frontmatter part is kept (the manifests need nothing else).
const fileCache = new Map<string, { mtimeMs: number; body: string }>();
let manifestCache: { at: number; files: Map<string, string> } | null = null;
let manifestBuild: Promise<void> | null = null;

async function readFrontmatterPart(file: string): Promise<string> {
  const text = await fs.readFile(file, 'utf8');
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('---', 3);
  return end === -1 ? text : text.slice(0, end + 8);
}

async function loadBody(file: string): Promise<string> {
  const { mtimeMs } = await fs.stat(file);
  const cached = fileCache.get(file);
  if (cached && cached.mtimeMs === mtimeMs) return cached.body;
  const body = await readFrontmatterPart(file);
  fileCache.set(file, { mtimeMs, body });
  return body;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function rebuildManifests(): Promise<void> {
  const root = contentRoot();
  const mdFiles = (await walk(path.join(root, 'books'))).filter((f) => f.endsWith('.md'));
  const bodies = await mapLimit(mdFiles, 4, loadBody);
  const files: CatalogFile[] = mdFiles.map((file, i) => ({ key: toKey(root, file), body: bodies[i] }));
  const { booksManifest, itemsManifest, slugsManifest, nameWarnings } = buildCatalogFromFiles(files);
  for (const warning of nameWarnings) console.warn(`[catalog] ${warning}`);
  const tocManifests = await buildTocManifests(files, booksManifest);
  manifestCache = {
    at: Date.now(),
    files: new Map([
      [BOOKS_MANIFEST_KEY, JSON.stringify(booksManifest)],
      [ITEMS_MANIFEST_KEY, JSON.stringify(itemsManifest)],
      [SLUGS_MANIFEST_KEY, JSON.stringify(slugsManifest)],
      ...tocManifests,
    ]),
  };
}

async function getManifestJson(key: string): Promise<string> {
  if (!manifestCache || Date.now() - manifestCache.at > MANIFEST_TTL_MS) {
    // one rebuild at a time; concurrent requests share it
    manifestBuild ??= rebuildManifests().finally(() => {
      manifestBuild = null;
    });
    await manifestBuild;
  }
  return manifestCache?.files.get(key) ?? (key === SLUGS_MANIFEST_KEY ? '{}' : '[]');
}

async function listAllKeys(): Promise<string[]> {
  const root = contentRoot();
  const keys = (await walk(root)).map((f) => toKey(root, f));
  const covers = coverRoot();
  if (covers) keys.push(...(await walk(covers)).map((f) => toKey(covers, f, 'cover/')));
  return keys;
}

/** Minimal R2Bucket look-alike: only get / head / list, which is all the site uses. */
export function getLocalBucket(): R2Bucket {
  const bucket = {
    async get(key: string) {
      if (key === BOOKS_MANIFEST_KEY || key === ITEMS_MANIFEST_KEY || key === SLUGS_MANIFEST_KEY) {
        const text = await getManifestJson(key);
        return { text: async () => text, json: async () => JSON.parse(text) };
      }
      if (key.startsWith(TOC_MANIFEST_PREFIX)) {
        await getManifestJson(BOOKS_MANIFEST_KEY); // makes sure the manifests are built
        const text = manifestCache?.files.get(key);
        return text === undefined ? null : { text: async () => text, json: async () => JSON.parse(text) };
      }
      const file = resolveKey(key);
      if (!file) return null;
      try {
        const buf = await fs.readFile(file);
        return {
          text: async () => normalizeBn(buf.toString('utf8')),
          json: async () => JSON.parse(normalizeBn(buf.toString('utf8'))),
          arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
        };
      } catch {
        return null;
      }
    },
    async head(key: string) {
      const file = resolveKey(key);
      if (!file) return null;
      try {
        await fs.access(file);
        return { key };
      } catch {
        return null;
      }
    },
    async list(options?: { prefix?: string }) {
      const prefix = options?.prefix || '';
      const keys = (await listAllKeys()).filter((k) => k.startsWith(prefix));
      return { objects: keys.map((key) => ({ key })), truncated: false };
    },
  };
  return bucket as unknown as R2Bucket;
}

/** Read one cover file for the dev-only /local-media route. */
export async function readLocalCover(relativePath: string): Promise<Buffer | null> {
  const file = resolveKey(`cover/${relativePath}`);
  if (!file) return null;
  try {
    return await fs.readFile(file);
  } catch {
    return null;
  }
}
