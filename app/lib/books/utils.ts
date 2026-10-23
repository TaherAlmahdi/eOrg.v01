import type { FrontmatterData } from '@/app/lib/frontmatter';
import { getSlug } from '@/app/lib/content/core/registry';
import { splitNames } from '@/app/lib/content/core/registry/names';
import { SeriesItem, Book } from './types';

/**
 * বাংলা ইউনিকোড এনকোডিং নরম্যালাইজার (য়, ড়, ঢ়, ব় এনকোডিং ফিক্স সহ)
 */
export function normalizeBanglaText(text: unknown): string {
  if (typeof text !== 'string' || !text) return '';
  return text
    .normalize('NFC')
    .replace(/\u09AF\u09BC/g, '\u09DF') // য + ় = য়
    .replace(/\u09A1\u09BC/g, '\u09DC') // ড + ় = ড়
    .replace(/\u09A2\u09BC/g, '\u09DD') // ঢ + ় = ঢ়
    .replace(/\u09AC\u09BC/g, '\u09E0'); // ব + ় = ব়
}

export const naturalSort = (a: string, b: string): number => {
  const normA = normalizeBanglaText(a);
  const normB = normalizeBanglaText(b);
  return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' });
};

// বাংলা সংখ্যাকে ইংরেজি সংখ্যায় রূপান্তর করার হেলপার
function normalizeDigits(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  return String(val)
    .trim()
    .replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
}

function parseNumberValue(val: unknown): number {
  const str = normalizeDigits(val);
  if (!str) return Infinity;
  const num = parseFloat(str);
  return isNaN(num) ? Infinity : num;
}

export function slugify(text: unknown): string {
  const normalized = normalizeBanglaText(text);
  if (!normalized) return '';
  return normalized
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF\-]/g, '');
}

export function parseSubdomains(subdomainRaw: unknown, defaultAuthorFolder: string): string[] {
  if (!subdomainRaw) return [defaultAuthorFolder, 'library'];

  if (Array.isArray(subdomainRaw)) {
    return subdomainRaw.map((s) => String(s).trim().toLowerCase());
  }

  if (typeof subdomainRaw === 'string' && subdomainRaw.trim()) {
    return subdomainRaw.split(',').map((s) => s.trim().toLowerCase());
  }

  return [defaultAuthorFolder, 'library'];
}

/** Genre, series and item names are read from the Bengali names only; links come from the slug registry. */
function uniqueNames(value: unknown): string[] {
  return Array.from(new Set(splitNames(value).map(normalizeBanglaText).filter(Boolean)));
}

export function extractGenresFromData(data: Record<string, unknown> | null | undefined): string[] {
  if (!data) return [];
  return uniqueNames(data.genre || data.genres);
}

export function generateSeriesLink(seriesName: string): string | undefined {
  if (!seriesName) return undefined;
  const normalizedName = normalizeBanglaText(seriesName);
  return `/series/${getSlug('series', normalizedName) || slugify(normalizedName)}`;
}

export function extractSeriesFromData(data: Record<string, unknown> | null | undefined): SeriesItem[] {
  if (!data) return [];
  const seriesList: SeriesItem[] = [];
  const seen = new Set<string>();

  const add = (rawName: unknown, order: unknown, title: unknown) => {
    const name = normalizeBanglaText(rawName);
    if (!name || seen.has(name)) return;
    seen.add(name);
    seriesList.push({
      name,
      slug: getSlug('series', name) || slugify(name),
      link: generateSeriesLink(name),
      order: String(order || ''),
      title: normalizeBanglaText(title),
    });
  };

  const raw = data.series_list || data.series_info || data.series;
  const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];

  for (const entry of entries) {
    if (typeof entry === 'object' && entry !== null) {
      const obj = entry as Record<string, unknown>;
      splitNames(obj.name).forEach((n) => add(n, obj.order || obj.series_order, obj.title));
    } else {
      // "A, B": no order of its own; a single name takes the legacy series_order / series_title fields
      const names = splitNames(entry);
      names.forEach((n) =>
        add(
          n,
          names.length === 1 && entries.length === 1 ? data.series_order || data.series_index : '',
          names.length === 1 && entries.length === 1 ? data.series_title : ''
        )
      );
    }
  }

  return seriesList;
}

export function generateGenreLinks(genresList: string[]): Array<{ name: string; link: string }> {
  return genresList.map((gName) => {
    const normName = normalizeBanglaText(gName);
    return {
      name: normName,
      link: `/genre/${getSlug('genres', normName) || slugify(normName)}`,
    };
  });
}

export function extractItemsFromData(data: Record<string, unknown> | null | undefined): string[] {
  if (!data) return [];
  return uniqueNames(data.item || data.items);
}

/**
 * টার্গেট সিরিজের সাপেক্ষে একটি বইয়ের অর্ডার খোঁজার হেলপার
 */
function getTargetSeriesOrder(book: FrontmatterData, targetSeries?: string): string | null {
  if (targetSeries) {
    const targetSlug = slugify(targetSeries);
    const rawSeriesList = book.series_list || book.series_info || book.series;

    if (Array.isArray(rawSeriesList)) {
      for (const item of rawSeriesList) {
        if (typeof item === 'object' && item !== null) {
          const sName = normalizeBanglaText(item.name);
          const sSlug = item.slug ? String(item.slug).trim() : slugify(sName);

          if (sSlug === targetSlug || slugify(sName) === targetSlug) {
            const orderVal = item.order ?? item.series_order ?? item.series_index;
            if (orderVal !== null && orderVal !== undefined && String(orderVal).trim() !== '') {
              return String(orderVal).trim();
            }
          }
        }
      }
    }
  }

  const topOrder = book.series_order ?? book.order;
  if (topOrder !== null && topOrder !== undefined && String(topOrder).trim() !== '') {
    return String(topOrder).trim();
  }

  return null;
}

/**
 * সিরিজের বইগুলোর জন্য রিফ্যাক্টর্ড সর্টিং হেলপার
 */
export function sortSeriesBooks<T extends Partial<Book> & FrontmatterData>(
  books: T[],
  targetSeries?: string
): T[] {
  if (!Array.isArray(books) || books.length <= 1) return books ? [...books] : [];

  return [...books].sort((a, b) => {
    const orderAStr = getTargetSeriesOrder(a, targetSeries);
    const orderBStr = getTargetSeriesOrder(b, targetSeries);

    const hasOrderA = orderAStr !== null;
    const hasOrderB = orderBStr !== null;

    // ১. টার্গেট সিরিজের নির্দিষ্ট Order থাকলে সেটি প্রাধান্য পাবে
    if (hasOrderA && hasOrderB) {
      const numA = parseNumberValue(orderAStr);
      const numB = parseNumberValue(orderBStr);
      if (numA !== numB) return numA - numB;
    } else if (hasOrderA) {
      return -1;
    } else if (hasOrderB) {
      return 1;
    }

    // ২. Order না থাকলে first_published তারিখ অনুযায়ী সর্ট হবে
    const firstPubA = a.first_published ?? a.firstPublished ?? a.year;
    const firstPubB = b.first_published ?? b.firstPublished ?? b.year;

    const hasPubA = firstPubA !== null && firstPubA !== undefined && String(firstPubA).trim() !== '';
    const hasPubB = firstPubB !== null && firstPubB !== undefined && String(firstPubB).trim() !== '';

    if (hasPubA && hasPubB) {
      const dateA = normalizeDigits(firstPubA);
      const dateB = normalizeDigits(firstPubB);
      const dateCompare = naturalSort(dateA, dateB);
      if (dateCompare !== 0) return dateCompare;
    } else if (hasPubA) {
      return -1;
    } else if (hasPubB) {
      return 1;
    }

    // ৩. শেষ ফালব্যাক হিসেবে শিরোনামের প্রাকৃতিক বর্ণানুক্রমিক সর্ট
    const titleA = String(a.title || a.name || '');
    const titleB = String(b.title || b.name || '');
    return naturalSort(titleA, titleB);
  });
}