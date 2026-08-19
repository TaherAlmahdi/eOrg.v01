import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getSlug } from '@/app/lib/content/core/registry';
import { SeriesItem, SubPageItem } from './types';
import { slugify } from './utils';

// কন্টেন্ট ডিরেক্টরি পাথ
const BOOKS_DIRECTORY = path.join(process.cwd(), 'content/books');
const ALTERNATE_BOOKS_DIRECTORY = path.join(process.cwd(), 'app/content/books');

/**
 * যেকোনো ফ্রন্টম্যাটার ডাটা থেকে genre/genres এক্সট্র্যাক্ট করার হেল্পার
 */
export function extractGenresFromData(data: any): string[] {
  if (!data || typeof data !== 'object') return [];
  const genresSet = new Set<string>();
  const rawGenre = data.genre || data.genres;

  if (typeof rawGenre === 'string' && rawGenre.trim()) {
    genresSet.add(rawGenre.trim());
  } else if (Array.isArray(rawGenre)) {
    rawGenre.forEach((g) => {
      if (typeof g === 'string' && g.trim()) genresSet.add(g.trim());
    });
  }

  return Array.from(genresSet);
}

/**
 * যেকোনো ফ্রন্টম্যাটার ডাটা থেকে একাধিক SeriesItem বের করার হেল্পার
 */
export function extractSeriesFromData(data: any): SeriesItem[] {
  if (!data || typeof data !== 'object') return [];
  const seriesList: SeriesItem[] = [];

  const rawSeriesList = data.series_list || data.series_info;
  if (Array.isArray(rawSeriesList)) {
    for (const item of rawSeriesList) {
      if (typeof item === 'object' && item !== null && item.name) {
        const sName = String(item.name).trim();
        const registrySlug = getSlug('series', sName);
        const sSlug = item.slug ? String(item.slug).trim() : registrySlug || slugify(sName) || encodeURIComponent(sName);
        const sLink = generateSeriesLink(item.link, sName, sSlug);
        seriesList.push({
          name: sName,
          slug: sSlug,
          link: sLink,
          order: item.order ?? item.series_order ?? item.series_index ?? '',
          title: item.title || '',
        });
      } else if (typeof item === 'string' && item.trim()) {
        const sName = item.trim();
        const registrySlug = getSlug('series', sName);
        const sSlug = registrySlug || slugify(sName) || encodeURIComponent(sName);
        seriesList.push({
          name: sName,
          slug: sSlug,
          link: generateSeriesLink(undefined, sName, sSlug),
        });
      }
    }
  }

  if (seriesList.length === 0 && data.series) {
    const rawSeries = data.series;
    if (typeof rawSeries === 'string' && rawSeries.trim()) {
      const sName = rawSeries.trim();
      const registrySlug = getSlug('series', sName);
      const sSlug = data.seriesSlug ? String(data.seriesSlug).trim() : registrySlug || slugify(sName) || encodeURIComponent(sName);
      seriesList.push({
        name: sName,
        slug: sSlug,
        link: generateSeriesLink(data.series_link, sName, sSlug),
        order: data.series_order ?? data.series_index ?? data.series_number ?? '',
        title: data.series_title || '',
      });
    } else if (Array.isArray(rawSeries)) {
      rawSeries.forEach((s) => {
        if (typeof s === 'string' && s.trim()) {
          const sName = s.trim();
          const registrySlug = getSlug('series', sName);
          const sSlug = registrySlug || slugify(sName) || encodeURIComponent(sName);
          seriesList.push({
            name: sName,
            slug: sSlug,
            link: generateSeriesLink(undefined, sName, sSlug),
          });
        }
      });
    }
  }

  return seriesList;
}

/**
 * ফ্রন্টম্যাটার থেকে Dynamic Genre Links তৈরি করার হেল্পার
 */
export function generateGenreLinks(
  explicitLinks: Array<{ name: string; link: string }> | undefined,
  genresList: string[]
): Array<{ name: string; link: string }> {
  if (explicitLinks && explicitLinks.length > 0) {
    return explicitLinks;
  }

  return genresList.map((gName) => {
    const registrySlug = getSlug('genres', gName);
    const targetSlug = registrySlug || slugify(gName) || encodeURIComponent(gName);
    return {
      name: gName,
      link: `/genre/${targetSlug}`,
    };
  });
}

/**
 * ফ্রন্টম্যাটার থেকে Dynamic Series Link তৈরি করার হেল্পার
 */
export function generateSeriesLink(
  explicitLink: string | undefined,
  seriesName: string,
  customSlug?: string
): string | undefined {
  if (explicitLink) return explicitLink;
  if (!seriesName) return undefined;

  const registrySlug = getSlug('series', seriesName);
  const targetSlug = customSlug || registrySlug || slugify(seriesName) || encodeURIComponent(seriesName);
  return `/series/${targetSlug}`;
}

/**
 * ফ্রন্টম্যাটার ডাটা থেকে item/items/pages/subPages এক্সট্র্যাক্ট করে 
 * TOC কম্পোনেন্টের উপযোগী SubPageItem অবজেক্টে রূপান্তর করার হেল্পার
 */
export function extractItemsFromData(data: any): SubPageItem[] {
  if (!data || typeof data !== 'object') return [];
  const rawItems = data.subPages || data.items || data.item || data.pages || data.itemTypes;
  const itemsList: SubPageItem[] = [];

  const addParsedItem = (item: any, index: number) => {
    if (typeof item === 'string' && item.trim()) {
      itemsList.push({
        pageNumber: index + 1,
        title: item.trim(),
      });
    } else if (typeof item === 'object' && item !== null) {
      const itemTitle = item.title || item.name || item.type || item.item || '';
      if (itemTitle) {
        itemsList.push({
          pageNumber: Number(item.pageNumber || item.page || index + 1),
          title: String(itemTitle).trim(),
          subtitle: item.subtitle ? String(item.subtitle).trim() : undefined,
        });
      }
    }
  };

  if (Array.isArray(rawItems)) {
    rawItems.forEach((item, index) => addParsedItem(item, index));
  } else if (rawItems) {
    addParsedItem(rawItems, 0);
  }

  return itemsList;
}

/**
 * একটি নির্দিষ্ট বুক ফোল্ডার ও তার সকল সাব-ফোল্ডারের .md ফাইল স্ক্যান করে Item সংগ্রহের হেল্পার
 */
export function collectChapterItemsDeep(bookFolderPath: string): string[] {
  const itemsSet = new Set<string>();

  if (!bookFolderPath || !existsSync(bookFolderPath)) {
    return [];
  }

  try {
    const scanDir = (dirPath: string) => {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const fileContent = readFileSync(fullPath, 'utf8');
            const { data: fileData } = matter(fileContent);
            const extracted = extractItemsFromData(fileData);
            extracted.forEach((i) => {
              if (i.title) itemsSet.add(i.title);
            });
          } catch {
            // ফাইল রিড ট্রাই-ক্যাচ ইগনোর
          }
        }
      }
    };
    scanDir(bookFolderPath);
  } catch {
    // ইগনোর
  }

  return Array.from(itemsSet);
}

/**
 * 🟢 মূল গ্লোবাল ফাংশন: পুরো app/content/books ফোল্ডার, সাব-ফোল্ডার ও গ্র্যান্ড-সাবফোল্ডারের
 * সমস্ত .md ফাইল রিকার্সিভলি স্ক্যান করে অনন্য (Unique) আইটেমের নাম এক্সট্র্যাক্ট করে।
 */
export function getAllExtractedItems(authorSlug?: string): string[] {
  let targetDir = BOOKS_DIRECTORY;
  if (!existsSync(targetDir) && existsSync(ALTERNATE_BOOKS_DIRECTORY)) {
    targetDir = ALTERNATE_BOOKS_DIRECTORY;
  }

  if (!existsSync(targetDir)) return [];

  const itemsSet = new Set<string>();

  const scanRecursive = (dirPath: string) => {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        scanRecursive(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        try {
          const fileContent = readFileSync(fullPath, 'utf8');
          const { data: frontmatter } = matter(fileContent);

          // নির্দিষ্ট লেখকের ফিল্টারিং (যদি ফিল্টার দেওয়া থাকে)
          if (authorSlug && authorSlug !== 'library') {
            const fileAuthor =
              frontmatter.authorSlug ||
              frontmatter.author_slug ||
              frontmatter.author;
            if (
              fileAuthor &&
              String(fileAuthor).toLowerCase() !== String(authorSlug).toLowerCase()
            ) {
              continue;
            }
          }

          // আইটেম এক্সট্র্যাক্ট করা
          const extracted = extractItemsFromData(frontmatter);
          extracted.forEach((item) => {
            if (item.title) itemsSet.add(item.title);
          });
        } catch {
          // ইগনোর
        }
      }
    }
  };

  scanRecursive(targetDir);
  return Array.from(itemsSet);
}