// lib/catalog/build.ts
// One place that turns book .md files into the two catalog manifests.
// Used by scripts/sync-assets-to-r2.ts (uploads them to R2) and by the local provider
// (serves them from disk in `next dev`), so what you see locally is what goes live.
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { computeBookHierarchy, tocManifestKey } from '../../app/lib/books/hierarchy-core';
import type { FrontmatterData } from '../../app/lib/frontmatter';
import { getItemSlug } from '../../app/lib/content/core/registry/items';
import { buildSlugManifest, fallbackSlug, registryTable, type SlugCategory, type SlugTable } from '../../app/lib/content/core/registry/slug-store';
import { normalizeBn } from '../../app/lib/bn-text';
import { closestName, splitNames } from '../../app/lib/content/core/registry/names';
import { normalizeBanglaText, toUrlSlug } from '../../app/lib/content/core/registry/slug';

export interface BookManifestEntry {
  authorFolder: string;
  bookFolder: string;
  bookPrefix: string;
  data: FrontmatterData;
  /** Hash of the book's prebuilt toc (see buildTocManifests); changes when a chapter is added, renamed or removed. */
  tocHash?: string;
}

export interface ItemManifestEntry {
  itemType: string;
  itemTypeSlug: string;
  title: string;
  slug?: string;
  titleSlug: string;
  bookTitle: string;
  bookSlug: string;
  author: string;
  authorSlug: string;
  href: string;
  r2Key: string;
  frontmatter: FrontmatterData;
}

/** A markdown file under content/, keyed by its path relative to content/ (e.g. "books/a/b/index.md"). */
export interface CatalogFile {
  key: string;
  body: string;
}

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\wঀ-৿-]+/g, '')
    .replace(/--+/g, '-');
}

function extractItemTypesFromData(data: FrontmatterData): string[] {
  return splitNames(data.item || data.items);
}

type FoundNames = Record<SlugCategory, Set<string>>;

/** Pushes the names of a frontmatter value (string, list of strings, or objects with a name) into `into`. */
function collectNames(value: unknown, into: Set<string>, splitList = false): void {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((v) => collectNames(v, into, splitList));
    return;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    collectNames(obj.name || obj.title || obj.label, into, splitList);
    return;
  }
  const text = String(value).trim();
  if (!text) return;
  into.add(text);
  if (splitList) {
    // "A, B" or "A এবং B" lists: each person gets a slug too
    const parts = text.split(/,|s+এবংs+/).map((t) => t.trim());
    if (parts.length > 1) parts.filter(Boolean).forEach((t) => into.add(t));
  }
}

/** Where a genre / series / item name was first written: "genres:উপন্যাস" -> "books/a/b/index.md". */
type NameSources = Map<string, string>;

/** Authors (also translators and editors), genres, series and items named by one book/item frontmatter. */
function collectFromFrontmatter(data: FrontmatterData, found: FoundNames, sources: NameSources, fileKey: string): void {
  for (const field of ['author', 'translator', 'editor']) collectNames(data[field], found.authors, true);
  const collect = (category: 'genres' | 'series' | 'items', value: unknown) => {
    for (const raw of splitNames(value)) {
      const name = raw.trim();
      found[category].add(name);
      if (!sources.has(`${category}:${name}`)) sources.set(`${category}:${name}`, fileKey);
    }
  };
  collect('genres', data.genre || data.genres);
  collect('series', data.series_list || data.series_info || data.series);
  collect('items', data.item || data.items);
}

const nameKey = (name: string): string => normalizeBanglaText(name).trim().toLowerCase();

/**
 * Genre, series and item names that have no slug yet (not in slug-data.ts or slug-auto.json).
 * A name close to a listed one is probably a typo: it is only reported ("did you mean ...?").
 * Any other name is new: it gets a transliterated slug, returned in `newSlugs` for sync-assets to save.
 */
function findUnlistedNames(
  found: FoundNames,
  sources: NameSources
): { warnings: string[]; newSlugs: Partial<SlugTable> } {
  const warnings: string[] = [];
  const newSlugs: Partial<SlugTable> = {};
  const registry = registryTable();
  for (const category of ['genres', 'series', 'items'] as const) {
    const listed = new Map(Object.keys(registry[category]).map((name) => [nameKey(name), name]));
    const usedSlugs = new Set(Object.values(registry[category]).map((slug) => toUrlSlug(slug)));
    for (const name of found[category]) {
      if (listed.has(nameKey(name))) continue;
      const where = sources.get(`${category}:${name}`);
      const suggestion = closestName(nameKey(name), listed.keys());
      if (suggestion) {
        warnings.push(`${category}: "${name}" is not listed — did you mean "${listed.get(suggestion)}"? (${where})`);
        continue;
      }
      const base = fallbackSlug(category, name);
      let slug = base;
      for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
      usedSlugs.add(slug);
      (newSlugs[category] ??= {})[name] = slug;
      warnings.push(`${category}: "${name}" is new — slug "${slug}" made by transliteration, saved in slug-auto.json by sync-assets (${where})`);
    }
  }
  return { warnings, newSlugs };
}

/**
 * Build the books and items manifests from the .md files of content/books/.
 * Files outside books/ or not ending in .md are ignored.
 */
export function buildCatalogFromFiles(files: CatalogFile[]): {
  booksManifest: BookManifestEntry[];
  itemsManifest: ItemManifestEntry[];
  slugsManifest: SlugTable;
  slugWarnings: string[];
  nameWarnings: string[];
  newSlugs: Partial<SlugTable>;
} {
  const found: FoundNames = {
    authors: new Set(),
    genres: new Set(),
    series: new Set(),
    tags: new Set(),
    books: new Set(),
    items: new Set(),
  };
  const sources: NameSources = new Map();
  const mdFiles = files.filter((f) => f.key.startsWith('books/') && f.key.endsWith('.md'));

  const booksManifest: BookManifestEntry[] = [];
  const bookMetaByPrefix = new Map<
    string,
    { bookTitle: string; bookSlug: string; author: string; authorSlug: string }
  >();

  // index.md files first, so book info is known before the item files are read
  for (const file of mdFiles) {
    const parts = file.key.split('/');
    if (parts[parts.length - 1] !== 'index.md' || parts.length !== 4) continue;

    const authorFolder = parts[1];
    const bookFolder = parts[2];
    const bookPrefix = `books/${authorFolder}/${bookFolder}/`;
    const { data } = matter(normalizeBn(file.body));

    booksManifest.push({ authorFolder, bookFolder, bookPrefix, data });
    collectFromFrontmatter(data, found, sources, file.key);
    bookMetaByPrefix.set(bookPrefix, {
      bookTitle: data.title || bookFolder,
      bookSlug: data.slug ? String(data.slug).trim() : bookFolder,
      author: data.author || 'Unknown author',
      authorSlug: data.authorSlug ? String(data.authorSlug).trim() : authorFolder,
    });
  }

  const itemsManifest: ItemManifestEntry[] = [];

  for (const file of mdFiles) {
    const parts = file.key.split('/');
    if (parts[parts.length - 1] === 'index.md') continue; // index.md files describe books, not items
    if (parts.length < 4) continue;

    const bookPrefix = `books/${parts[1]}/${parts[2]}/`;
    const bookMeta = bookMetaByPrefix.get(bookPrefix);
    if (!bookMeta) continue; // this book's index.md wasn't found

    const { data: fileData } = matter(normalizeBn(file.body));
    const itemTypes = extractItemTypesFromData(fileData);
    if (itemTypes.length === 0) continue;
    collectFromFrontmatter(fileData, found, sources, file.key);

    const fileName = parts[parts.length - 1].replace(/\.md$/, '');
    const itemTitle = fileData.item_title || fileData.title || fileName;
    const rawFrontmatterSlug = fileData.slug ? String(fileData.slug).trim() : undefined;
    const titleSlug = rawFrontmatterSlug || slugify(itemTitle) || fileName;

    for (const type of itemTypes) {
      const itemTypeSlug = getItemSlug(type); // same registry the site uses
      itemsManifest.push({
        itemType: type,
        itemTypeSlug,
        title: itemTitle,
        slug: rawFrontmatterSlug,
        titleSlug,
        bookTitle: bookMeta.bookTitle,
        bookSlug: bookMeta.bookSlug,
        author: bookMeta.author,
        authorSlug: bookMeta.authorSlug,
        href: `/items/${itemTypeSlug}/${encodeURIComponent(titleSlug)}`,
        r2Key: file.key,
        frontmatter: fileData,
      });
    }
  }

  itemsManifest.sort((a, b) => a.title.localeCompare(b.title, 'bn'));
  const { warnings: nameWarnings, newSlugs } = findUnlistedNames(found, sources);
  const { manifest: slugsManifest, warnings: slugWarnings } = buildSlugManifest(found, newSlugs);
  return { booksManifest, itemsManifest, slugsManifest, slugWarnings, nameWarnings, newSlugs };
}

/**
 * Builds the prebuilt table of contents of every book (R2 key -> JSON text) from the same .md files,
 * so a chapter page reads one small file instead of every chapter of the book.
 * Also stamps each books-manifest entry with `tocHash`: the books manifest changes whenever a toc does,
 * which is what makes the page cache (worker/page-cache.ts) drop pages that show the old table of contents.
 * Upload the returned files BEFORE the books manifest.
 */
export async function buildTocManifests(
  files: CatalogFile[],
  booksManifest: BookManifestEntry[]
): Promise<Map<string, string>> {
  const bodies = new Map<string, string>();
  for (const file of files) {
    if (file.key.startsWith('books/') && file.key.endsWith('.md')) bodies.set(file.key, file.body);
  }
  const allKeys = Array.from(bodies.keys());
  const tocs = new Map<string, string>();

  for (const entry of booksManifest) {
    const bookKeys = allKeys.filter((key) => key.startsWith(entry.bookPrefix));
    const hierarchy = await computeBookHierarchy(entry.bookPrefix, entry.bookFolder, bookKeys, async (key) => {
      const body = bodies.get(key);
      return body === undefined ? null : normalizeBn(body);
    });
    const json = JSON.stringify({ bookSlug: entry.bookFolder, ...hierarchy });
    tocs.set(tocManifestKey(entry.bookPrefix), json);
    entry.tocHash = createHash('md5').update(json).digest('hex').slice(0, 12);
  }
  return tocs;
}

export interface BioIndexEntry {
  name?: string;
  image?: string;
  summary?: string;
}

/**
 * Index of the biographies (content/pages/bio/<slug>.md): name, image and `summary` of each, keyed by file slug.
 * The library author page shows the summary without reading the biography files, and the page cache watches this
 * manifest, so an edited summary shows up without waiting for the 7-day cache to run out.
 */
export function buildBioIndex(files: CatalogFile[]): Record<string, BioIndexEntry> {
  const index: Record<string, BioIndexEntry> = {};
  for (const file of files) {
    const match = /^pages\/bio\/([^/]+)\.md$/.exec(file.key);
    if (!match) continue;
    const { data } = matter(normalizeBn(file.body));
    const entry: BioIndexEntry = {};
    if (data.name || data.title) entry.name = String(data.name || data.title).trim();
    if (data.image) entry.image = String(data.image).trim();
    if (data.summary) entry.summary = String(data.summary).trim();
    index[match[1].toLowerCase()] = entry;
  }
  return index;
}
