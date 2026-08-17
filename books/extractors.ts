import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getSlug } from '@/app/lib/content/core/registry';
import { SeriesItem } from './types';
import { slugify } from './utils';

/**
 * যেকোনো ফ্রন্টম্যাটার ডাটা থেকে genre/genres এক্সট্র্যাক্ট করার হেল্পার
 */
export function extractGenresFromData(data: any): string[] {
  if (!data) return [];
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
  if (!data) return [];
  const seriesList: SeriesItem[] = [];

  // ১. যদি স্ট্রাকচার্ড series_list বা series_info থাকে (অ্যারে অবজেক্ট হিসেবে)
  const rawSeriesList = data.series_list || data.series_info;
  if (Array.isArray(rawSeriesList)) {
    for (const item of rawSeriesList) {
      if (typeof item === 'object' && item.name) {
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

  // ২. যদি সাধারণ series ফিল্ড থাকে (String বা Array of Strings)
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
 * ফ্রন্টম্যাটার থেকে Dynamic Genre Links তৈরি করার হেল্পার (registry সহ fallback বাংলা স্লাগ)
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
 * ফ্রন্টম্যাটার থেকে Dynamic Series Link তৈরি করার হেল্পার (registry সহ fallback বাংলা স্লাগ)
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
 * যেকোনো ফ্রন্টম্যাটার ডাটা থেকে item/items (কবিতা, গল্প, প্রবন্ধ ইত্যাদি) এক্সট্র্যাক্ট করার হেল্পার
 */
export function extractItemsFromData(data: any): string[] {
  if (!data) return [];
  const itemsSet = new Set<string>();
  const rawItem = data.item || data.items;

  if (typeof rawItem === 'string' && rawItem.trim()) {
    itemsSet.add(rawItem.trim());
  } else if (Array.isArray(rawItem)) {
    rawItem.forEach((i) => {
      if (typeof i === 'string' && i.trim()) itemsSet.add(i.trim());
    });
  }

  return Array.from(itemsSet);
}

/**
 * শুধুমাত্র চ্যাপ্টার বা পাতার ফাইলগুলো স্ক্যান করে Item/Items সংগ্রাহক হেল্পার।
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
          if (entry.name.toLowerCase() === 'index.md') continue;

          try {
            const fileContent = readFileSync(fullPath, 'utf8');
            const { data: fileData } = matter(fileContent);
            extractItemsFromData(fileData).forEach((i) => itemsSet.add(i));
          } catch {
            // ফাইল রিড এরর ক্যাচ
          }
        }
      }
    };
    scanDir(bookFolderPath);
  } catch {
    // ডিরেক্টরি ট্রাভার্সাল এরর ক্যাচ
  }

  return Array.from(itemsSet);
}