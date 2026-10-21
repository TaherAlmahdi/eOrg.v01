// lib/catalog/build.ts
// One place that turns book .md files into the two catalog manifests.
// Used by scripts/sync-assets-to-r2.ts (uploads them to R2) and by the local provider
// (serves them from disk in `next dev`), so what you see locally is what goes live.
import matter from 'gray-matter';
import type { FrontmatterData, FrontmatterValue } from '../../app/lib/frontmatter';
import { getItemSlug } from '../../app/lib/content/core/registry/items';
import { buildSlugManifest, type SlugCategory, type SlugTable } from '../../app/lib/content/core/registry/slug-store';

export interface BookManifestEntry {
  authorFolder: string;
  bookFolder: string;
  bookPrefix: string;
  data: FrontmatterData;
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

function parseItemName(itemVal: FrontmatterValue): string {
  if (!itemVal) return '';
  if (typeof itemVal === 'string') return itemVal.trim();
  if (typeof itemVal === 'object') {
    return (itemVal.name || itemVal.title || itemVal.label || '').trim();
  }
  return String(itemVal).trim();
}

function extractItemTypesFromData(data: FrontmatterData): string[] {
  const rawItem = data.item || data.items;
  if (!rawItem) return [];
  if (Array.isArray(rawItem)) {
    return rawItem.map(parseItemName).filter(Boolean);
  }
  const parsed = parseItemName(rawItem);
  return parsed ? [parsed] : [];
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

/** Authors (also translators and editors), genres and series named by one book/item frontmatter. */
function collectFromFrontmatter(data: FrontmatterData, found: FoundNames): void {
  for (const field of ['author', 'translator', 'editor']) collectNames(data[field], found.authors, true);
  collectNames(data.genre, found.genres);
  collectNames(data.genres, found.genres);
  collectNames(data.series, found.series);
  collectNames(data.series_list, found.series);
  collectNames(data.series_info, found.series);
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
} {
  const found: FoundNames = {
    authors: new Set(),
    genres: new Set(),
    series: new Set(),
    tags: new Set(),
    books: new Set(),
    items: new Set(),
  };
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
    const { data } = matter(file.body);

    booksManifest.push({ authorFolder, bookFolder, bookPrefix, data });
    collectFromFrontmatter(data, found);
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

    const { data: fileData } = matter(file.body);
    const itemTypes = extractItemTypesFromData(fileData);
    if (itemTypes.length === 0) continue;
    collectFromFrontmatter(fileData, found);
    itemTypes.forEach((t) => found.items.add(t));

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
  const { manifest: slugsManifest, warnings: slugWarnings } = buildSlugManifest(found);
  return { booksManifest, itemsManifest, slugsManifest, slugWarnings };
}
