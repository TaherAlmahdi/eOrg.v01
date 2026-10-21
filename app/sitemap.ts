// app/sitemap.ts
// Host-aware sitemap: every site (main, library, each author subdomain) lists its own pages.
import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';
import { getBookEntries } from '@/lib/catalog';
import { getChapterPathSegments } from '@/lib/catalog/chapter-paths';
import { listKeysUnderPrefix } from '@/app/lib/books/r2';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getSlug } from '@/app/lib/content/core/registry';

export const dynamic = 'force-dynamic';

const asPath = (...segments: string[]) => '/' + segments.map(encodeURIComponent).join('/');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = ((await headers()).get('host') || 'eduliture.org').toLowerCase();
  const isLocal = host.includes('localhost') || /^\d{1,3}(\.\d{1,3}){3}/.test(host);
  const origin = `${isLocal ? 'http' : 'https'}://${host}`;

  const subdomain = getSubdomainData(host).subdomain || '';
  const isLibrary = subdomain === 'library';

  const paths = new Set<string>(['/', '/about', '/books', '/genres']);
  if (isLibrary) {
    paths.add('/authors');
    paths.add('/items');
  }

  const books = await getBookEntries(subdomain || undefined);

  // book folder (e.g. "books/bankim/durgeshnandini/") -> URL slug
  const slugByPrefix = new Map<string, string>();
  for (const book of books) {
    const slug = String(book.data?.slug || '').trim() || book.bookFolder;
    slugByPrefix.set(book.bookPrefix, slug);
    paths.add(asPath('book', slug));

    const genres = book.data?.genre ?? book.data?.genres;
    for (const genre of ([] as unknown[]).concat(genres ?? [])) {
      if (typeof genre === 'string' && genre.trim()) paths.add(asPath('genre', getSlug('genres', genre)));
    }
    if (isLibrary && typeof book.data?.author === 'string' && book.data.author.trim()) {
      paths.add(asPath('author', getSlug('authors', book.data.author)));
    }
  }

  // Chapters are derived from the file layout alone (no file reads)
  const keys = await listKeysUnderPrefix('books/');
  for (const segments of getChapterPathSegments(keys, slugByPrefix)) {
    paths.add(asPath('book', ...segments));
  }

  return Array.from(paths).map((p) => ({
    url: `${origin}${p === '/' ? '' : p}`,
    changeFrequency: p === '/' ? 'daily' : 'weekly',
    priority: p === '/' ? 1 : p.split('/').length <= 3 ? 0.8 : 0.6,
  }));
}
