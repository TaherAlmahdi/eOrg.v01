// lib/catalog/entries.ts
// Single read path for the R2 manifests (no fs, no Supabase).
import { getManifest } from '@/app/lib/books/r2';
import { getAllLibraryItems, type LibraryItemEntry } from '@/app/lib/books/items';
import { parseSubdomains } from '@/app/lib/books/utils';

export interface BookEntry {
  authorFolder: string;
  bookFolder: string;
  bookPrefix: string; // e.g. "books/bankim/durgeshnandini/"
  data: Record<string, unknown>;
}

const isSubdomainAllowed = (bookSubdomains: string[], subdomain?: string): boolean => {
  if (!subdomain) return true;
  const key = subdomain.toLowerCase();
  // main site and the library show every book, whatever the frontmatter `subdomain` says
  if (key === 'main' || key === 'www' || key === 'library') return true;
  return bookSubdomains.includes(key);
};

/**
 * Book entries from the books manifest (index.md frontmatter only).
 * Pass a subdomain to keep only the books that belong to that tenant.
 */
export async function getBookEntries(subdomain?: string): Promise<BookEntry[]> {
  const manifest = (await getManifest()) as BookEntry[];
  return manifest.filter((entry) =>
    isSubdomainAllowed(parseSubdomains(entry.data?.subdomain, entry.authorFolder), subdomain)
  );
}

/**
 * Item entries (one per item type per .md file inside a book folder),
 * restricted to the books of the given subdomain.
 */
export async function getItemEntries(subdomain?: string): Promise<LibraryItemEntry[]> {
  const items = await getAllLibraryItems();
  if (!subdomain) return items;

  const books = await getBookEntries(subdomain);
  if (books.length === 0) return [];
  const prefixes = new Set(books.map((b) => b.bookPrefix));

  return items.filter((item) => {
    const parts = item.r2Key.split('/');
    return prefixes.has(`${parts[0]}/${parts[1]}/${parts[2]}/`);
  });
}
