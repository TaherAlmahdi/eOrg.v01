import path from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import matter from 'gray-matter';
import { getSlug } from '@/app/lib/content/core/registry';
import { SeriesItem, Book } from './types';

export const booksDirectory = path.resolve(process.cwd(), 'content', 'books');

/**
 * বাংলা ইউনিকোড এনকোডিং নরম্যালাইজার (য়, ড়, ঢ়, ব় এনকোডিং ফিক্স সহ)
 */
export function normalizeBanglaText(text: unknown): string {
  if (typeof text !== 'string' || !text) return '';
  return text
    .normalize('NFC')
    .replace(/\u09AF\u09BC/g, '\u09DF') // য + ় = য়
    .replace(/\u09A1\u09BC/g, '\u09DC') // ড + ় = ড়
    .replace(/\u09A2\u09BC/g, '\u09DD') // ঢ + ় = ঢ়
    .replace(/\u09AC\u09BC/g, '\u09E0'); // ব + ় = ব়
}

export const naturalSort = (a: string, b: string): number => {
  const normA = normalizeBanglaText(a);
  const normB = normalizeBanglaText(b);
  return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' });
};

// বাংলা সংখ্যাকে ইংরেজি সংখ্যায় রূপান্তর করার হেলপার
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

export function extractGenresFromData(data: Record<string, unknown> | null | undefined): string[] {
  if (!data) return [];
  const genresSet = new Set<string>();
  const rawGenre = data.genre || data.genres;

  if (typeof rawGenre === 'string' && rawGenre.trim()) {
    genresSet.add(normalizeBanglaText(rawGenre.trim()));
  } else if (Array.isArray(rawGenre)) {
    rawGenre.forEach((g) => {
      if (typeof g === 'string' && g.trim()) {
        genresSet.add(normalizeBanglaText(g.trim()));
      }
    });
  }

  return Array.from(genresSet);
}

export function generateSeriesLink(
  explicitLink: string | undefined,
  seriesName: string,
  customSlug?: string
): string | undefined {
  if (explicitLink) return explicitLink;
  if (!seriesName) return undefined;

  const normalizedName = normalizeBanglaText(seriesName);
  const targetSlug = customSlug || getSlug('series', normalizedName) || slugify(normalizedName);
  return `/series/${targetSlug}`;
}

export function extractSeriesFromData(data: Record<string, unknown> | null | undefined): SeriesItem[] {
  if (!data) return [];
  const seriesList: SeriesItem[] = [];

  const rawSeriesList =
    data.series_list ||
    data.series_info ||
    (Array.isArray(data.series) && typeof data.series[0] === 'object' ? data.series : null);

  if (Array.isArray(rawSeriesList)) {
    for (const item of rawSeriesList) {
      if (typeof item === 'object' && item !== null && 'name' in item) {
        const itemObj = item as Record<string, unknown>;
        const sName = normalizeBanglaText(itemObj.name);
        const sSlug = itemObj.slug
          ? String(itemObj.slug).trim()
          : getSlug('series', sName) || slugify(sName);
        const sLink = generateSeriesLink(
          typeof itemObj.link === 'string' ? itemObj.link : undefined,
          sName,
          sSlug
        );

        seriesList.push({
          name: sName,
          slug: sSlug,
          link: sLink,
          order: String(itemObj.order || itemObj.series_order || ''),
          title: normalizeBanglaText(itemObj.title),
        });
      }
    }
    if (seriesList.length > 0) return seriesList;
  }

  if (data.series) {
    const rawSeries = data.series;
    if (typeof rawSeries === 'string' && rawSeries.trim()) {
      const sName = normalizeBanglaText(rawSeries);
      const sSlug = data.seriesSlug
        ? String(data.seriesSlug).trim()
        : getSlug('series', sName) || slugify(sName);

      seriesList.push({
        name: sName,
        slug: sSlug,
        link: generateSeriesLink(
          typeof data.series_link === 'string' ? data.series_link : undefined,
          sName,
          sSlug
        ),
        order: String(data.series_order || data.series_index || ''),
        title: normalizeBanglaText(data.series_title),
      });
    } else if (Array.isArray(rawSeries)) {
      rawSeries.forEach((s) => {
        if (typeof s === 'string' && s.trim()) {
          const sName = normalizeBanglaText(s);
          const sSlug = getSlug('series', sName) || slugify(sName);
          seriesList.push({
            name: sName,
            slug: sSlug,
            link: generateSeriesLink(undefined, sName, sSlug),
            order: '',
            title: '',
          });
        }
      });
    }
  }

  return seriesList;
}

export function generateGenreLinks(
  explicitLinks: Array<{ name: string; link: string }> | undefined,
  genresList: string[]
): Array<{ name: string; link: string }> {
  if (explicitLinks && explicitLinks.length > 0) {
    return explicitLinks.map((g) => ({
      name: normalizeBanglaText(g.name),
      link: g.link,
    }));
  }

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
  const itemsSet = new Set<string>();
  const rawItem = data.item || data.items;

  if (typeof rawItem === 'string' && rawItem.trim()) {
    itemsSet.add(normalizeBanglaText(rawItem.trim()));
  } else if (Array.isArray(rawItem)) {
    rawItem.forEach((i) => {
      if (typeof i === 'string' && i.trim()) {
        itemsSet.add(normalizeBanglaText(i.trim()));
      }
    });
  }

  return Array.from(itemsSet);
}

export function collectChapterItemsDeep(bookFolderPath: string): string[] {
  const itemsSet = new Set<string>();

  if (!bookFolderPath || !existsSync(bookFolderPath)) {
    return [];
  }

  try {
    // ১. সবার আগে মূল বইয়ের নিজস্ব index.md ফাইলের ফ্রন্টম্যাটার থেকে আইটেমগুলো যুক্ত করা হলো
    const mainIndexPath = path.join(bookFolderPath, 'index.md');
    if (existsSync(mainIndexPath)) {
      try {
        const mainContent = readFileSync(mainIndexPath, 'utf8');
        const { data: mainData } = matter(mainContent);
        extractItemsFromData(mainData).forEach((i) => itemsSet.add(i));
      } catch {
        // Read error ignored
      }
    }

    // ২. এরপর সাব-ফোল্ডার বা সাব-ফাইলগুলো স্ক্যান করা হবে
    const scanDir = (dirPath: string) => {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          if (entry.name.toLowerCase() === 'index.md') continue;

          try {
            const fileContent = readFileSync(fullPath, 'utf8');
            const { data: fileData } = matter(fileContent);
            extractItemsFromData(fileData).forEach((i) => itemsSet.add(i));
          } catch {
            // Read error ignored
          }
        }
      }
    };
    scanDir(bookFolderPath);
  } catch {
    // Directory traversal error ignored
  }

  return Array.from(itemsSet);
}

/**
 * টার্গেট সিরিজের সাপেক্ষে একটি বইয়ের অর্ডার খোঁজার হেলপার
 */
function getTargetSeriesOrder(book: Record<string, any>, targetSeries?: string): string | null {
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
export function sortSeriesBooks<T extends Partial<Book> & Record<string, any>>(
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

    // ২. Order না থাকলে first_published তারিখ অনুযায়ী সর্ট হবে
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