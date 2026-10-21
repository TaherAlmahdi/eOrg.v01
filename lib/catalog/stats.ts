// lib/catalog/stats.ts
import { getItemMeta } from '@/app/lib/content/core/registry/items';
import { getBookEntries } from './entries';
import { getItemTypeSummaries } from './items';

export interface LibraryStatsData {
  totalAuthors: number;
  totalBooks: number;
  totalSeries: number;
  totalGenres: number;
  totalItems: number;
}

const normalizeText = (text: unknown): string =>
  String(text ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();

/** Adds every name found in a string / array / {name,title,label} value to the set. */
const addValues = (target: Set<string>, raw: unknown): void => {
  if (!raw) return;

  const addString = (value: unknown) => {
    String(value)
      .split(/[,;|]/)
      .map(normalizeText)
      .filter(Boolean)
      .forEach((part) => target.add(part));
  };

  const addOne = (value: unknown) => {
    if (!value) return;
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const name = obj.name || obj.title || obj.label;
      if (name) addString(name);
    } else {
      addString(value);
    }
  };

  if (Array.isArray(raw)) raw.forEach(addOne);
  else addOne(raw);
};

/**
 * Library totals computed from the R2 manifests.
 * Definitions match the old generated stats: authors include translators and editors.
 */
export async function getLibraryStatsData(subdomain?: string): Promise<LibraryStatsData> {
  const books = await getBookEntries(subdomain);

  const authors = new Set<string>();
  const series = new Set<string>();
  const genres = new Set<string>();

  for (const { data } of books) {
    for (const key of ['author', 'authors', 'author_name', 'writer', 'translator', 'translators', 'translator_name', 'editor', 'editors', 'editor_name']) {
      addValues(authors, data[key]);
    }
    addValues(series, data.series);
    addValues(series, data.series_list);
    for (const key of ['genre', 'genres', 'category', 'categories']) {
      addValues(genres, data[key]);
    }
  }

  const itemTypes = await getItemTypeSummaries({ subdomain });
  const itemSlugs = new Set(itemTypes.map((t) => getItemMeta(t.label).slug || t.slug));

  return {
    totalAuthors: authors.size,
    totalBooks: books.length,
    totalSeries: series.size,
    totalGenres: genres.size,
    totalItems: itemSlugs.size,
  };
}
