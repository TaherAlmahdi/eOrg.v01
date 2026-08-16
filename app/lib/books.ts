import fs from 'fs/promises';
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getSlug } from '@/app/lib/content/core/registry';

// ==========================================
// 1. Core Interfaces & Types
// ==========================================

export interface ChapterItem {
  slug: string;
  title: string;
  genre?: string | string[];
  genres?: string[];
  item?: string | string[];
  items?: string[];
  content?: string;
  series?: string | string[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
}

export interface VolumeItem {
  id: string;
  title: string;
  chapters?: ChapterItem[];
  series?: string | string[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
}

export interface MetaFileItem {
  slug: string;
  title: string;
}

export interface SeriesItem {
  name: string;
  slug: string;
  link?: string;
  order?: number | string;
  title?: string;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  meta_title?: string;
  meta_description?: string;
  author: string;
  authorSlug: string;
  translator?: string;
  translatorSlug?: string;
  editor?: string;
  editorSlug?: string;
  subdomains: string[];
  genres: string[];
  genre?: string | string[];
  genre_links?: Array<{ name: string; link: string }>;
  items?: string[];
  item?: string | string[];
  series?: string | string[];
  seriesList?: SeriesItem[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
  series_title?: string;
  series_info?: SeriesItem | SeriesItem[];
  volumes?: VolumeItem[];
  directChapters?: ChapterItem[];
  metaFiles?: MetaFileItem[];
  publishDate?: string;
  published?: string;
  first_published?: string | number;
  publisher?: string;
  cover?: string;
  cover_image?: string;
  source_book?: string | number;
  pub_medium?: string;
  notice?: string;
  og_image?: string;
  footnotes?: string[];
  chapter_title?: string;
  volume_title?: string;
  currentChapterTitle?: string;
  currentVolumeTitle?: string;
  prevLink?: string;
  prevLabel?: string;
  nextLink?: string;
  nextLabel?: string;
}

export interface BookDetail extends Book {
  content: string;
  rawFrontmatter: Record<string, unknown>;
}

export interface BookNode {
  type: 'volume' | 'chapter';
  href: string;
  title: string;
  volId: string;
  chapterSlug?: string;
  filePath: string;
  series?: string | string[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
}

// ==========================================
// 2. Helper Functions
// ==========================================

const booksDirectory = path.resolve(process.cwd(), 'content', 'books');

/**
 * আলফানিউমেরিক বা প্রাকৃতিক ক্রমানুসারে ফাইল/ফোল্ডার সর্টিং
 */
const naturalSort = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/**
 * যেকোনো স্ট্রিংকে স্লাগে রূপান্তর করার হেল্পার
 */
function slugify(text: string): string {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF\-]/g, ''); // বাংলা বর্ণমালা ও হাইফেন সাপোর্ট
}

/**
 * স্ট্রিম/স্ট্রিং থেকে সাবডোমেন অ্যারে বের করার হেল্পার
 */
function parseSubdomains(subdomainRaw: unknown, defaultAuthorFolder: string): string[] {
  if (!subdomainRaw) return [defaultAuthorFolder, 'library'];

  if (Array.isArray(subdomainRaw)) {
    return subdomainRaw.map((s) => String(s).trim().toLowerCase());
  }

  if (typeof subdomainRaw === 'string') {
    return subdomainRaw.split(',').map((s) => s.trim().toLowerCase());
  }

  return [defaultAuthorFolder, 'library'];
}

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
        const sSlug = item.slug ? String(item.slug).trim() : getSlug('series', sName) || slugify(sName);
        const sLink = generateSeriesLink(item.link, sName, sSlug);
        seriesList.push({
          name: sName,
          slug: sSlug,
          link: sLink,
          order: item.order || item.series_order || '',
          title: item.title || '',
        });
      } else if (typeof item === 'string' && item.trim()) {
        const sName = item.trim();
        const sSlug = getSlug('series', sName) || slugify(sName);
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
      const sSlug = data.seriesSlug ? String(data.seriesSlug).trim() : getSlug('series', sName) || slugify(sName);
      seriesList.push({
        name: sName,
        slug: sSlug,
        link: generateSeriesLink(data.series_link, sName, sSlug),
        order: data.series_order || data.series_index || '',
        title: data.series_title || '',
      });
    } else if (Array.isArray(rawSeries)) {
      rawSeries.forEach((s) => {
        if (typeof s === 'string' && s.trim()) {
          const sName = s.trim();
          const sSlug = getSlug('series', sName) || slugify(sName);
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
 * ফ্রন্টম্যাটার থেকে Dynamic Genre Links তৈরি করার হেল্পার (registry সহ)
 */
export function generateGenreLinks(
  explicitLinks: Array<{ name: string; link: string }> | undefined,
  genresList: string[]
): Array<{ name: string; link: string }> {
  if (explicitLinks && explicitLinks.length > 0) {
    return explicitLinks;
  }

  return genresList.map((gName) => ({
    name: gName,
    link: `/genre/${getSlug('genres', gName)}`,
  }));
}

/**
 * ফ্রন্টম্যাটার থেকে Dynamic Series Link তৈরি করার হেল্পার (registry সহ)
 */
export function generateSeriesLink(
  explicitLink: string | undefined,
  seriesName: string,
  customSlug?: string
): string | undefined {
  if (explicitLink) return explicitLink;
  if (!seriesName) return undefined;

  const targetSlug = customSlug || getSlug('series', seriesName) || slugify(seriesName);
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
function collectChapterItemsDeep(bookFolderPath: string): string[] {
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

// ==========================================
// 3. Main Data Fetching Functions
// ==========================================

/**
 * ১. লাইব্রেরি বা সাবডোমেন ভিত্তিক বইয়ের তালিকা ফেচ করা
 */
export async function getLibraryBooks(currentSubdomain?: string): Promise<{
  latestBooks: Book[];
  booksByGenre: Record<string, Book[]>;
  booksBySeries: Record<string, Book[]>;
}> {
  const allBooks: Book[] = [];

  if (!existsSync(booksDirectory)) {
    return { latestBooks: [], booksByGenre: {}, booksBySeries: {} };
  }

  try {
    const authorItems = await fs.readdir(booksDirectory, { withFileTypes: true });

    for (const authorItem of authorItems) {
      if (!authorItem.isDirectory()) continue;

      const authorFolderName = authorItem.name;
      const authorFolderPath = path.join(booksDirectory, authorFolderName);
      const bookItems = await fs.readdir(authorFolderPath, { withFileTypes: true });

      for (const bookItem of bookItems) {
        if (!bookItem.isDirectory()) continue;

        const bookFolderName = bookItem.name;
        const bookFolderPath = path.join(authorFolderPath, bookFolderName);
        const indexMdPath = path.join(bookFolderPath, 'index.md');

        if (!existsSync(indexMdPath)) continue;

        try {
          const fileContents = await fs.readFile(indexMdPath, 'utf8');
          const { data } = matter(fileContents);

          const bookSubdomains = parseSubdomains(data.subdomain, authorFolderName);

          if (currentSubdomain && !['main', 'www'].includes(currentSubdomain.toLowerCase())) {
            if (!bookSubdomains.includes(currentSubdomain.toLowerCase())) {
              continue;
            }
          }

          // ১. জঁরা শুধুমাত্র index.md থেকে সংগৃহীত
          const bookGenres = extractGenresFromData(data);
          if (bookGenres.length === 0) bookGenres.push('অন্যান্য');

          // ২. আইটেমস সংগৃহীত হবে চ্যাপ্টার/পাতার ফাইলসমূহ থেকে (index.md ব্যতিরেকে)
          const extractedItems = collectChapterItemsDeep(bookFolderPath);

          const bookSlug = data.slug ? String(data.slug).trim() : bookFolderName;

          // ৩. একাধিক সিরিজের সাপোর্ট এক্সট্র্যাক্ট করা
          const extractedSeriesList = extractSeriesFromData(data);
          const seriesNames = extractedSeriesList.map((s) => s.name);

          // ব্যাকওয়ার্ড কমপ্যাটিবিলিটির জন্য প্রথম সিরিজ ডাটা
          const primarySeries = extractedSeriesList[0];

          // জঁরা লিঙ্কস জেনারেট
          const genreLinksVal = generateGenreLinks(data.genre_links, bookGenres);

          allBooks.push({
            id: bookSlug,
            slug: bookSlug,
            title: data.title || 'শিরোনামহীন বই',
            subtitle: data.subtitle || '',
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
            author: data.author || 'অজ্ঞাত লেখক',
            authorSlug: data.authorSlug || authorFolderName,
            translator: data.translator || '',
            translatorSlug: data.translatorSlug || '',
            editor: data.editor || '',
            editorSlug: data.editorSlug || '',
            subdomains: bookSubdomains,
            genres: bookGenres,
            genre: data.genre || bookGenres,
            genre_links: genreLinksVal,
            items: extractedItems,
            item: extractedItems,
            series: seriesNames.length > 1 ? seriesNames : primarySeries?.name || '',
            seriesList: extractedSeriesList,
            seriesSlug: primarySeries?.slug || '',
            series_link: primarySeries?.link || '',
            series_order: primarySeries?.order || '',
            series_title: primarySeries?.title || data.series_title || '',
            series_info: extractedSeriesList.length > 1 ? extractedSeriesList : primarySeries,
            volumes: data.volumes || [],
            directChapters: data.directChapters || [],
            metaFiles: data.metaFiles || [],
            publishDate: data.published ? String(data.published) : data.date ? String(data.date) : '',
            published: data.published ? String(data.published) : '',
            first_published: data.first_published || '',
            publisher: data.publisher ? String(data.publisher) : '',
            cover: data.cover || data.cover_image || '',
            cover_image: data.cover_image || data.cover || '',
            source_book: data.source_book || '',
            pub_medium: data.pub_medium ? String(data.pub_medium) : '',
            notice: data.notice ? String(data.notice) : '',
            og_image: data.og_image || '',
            footnotes: data.footnotes || [],
            chapter_title: data.chapter_title || '',
            volume_title: data.volume_title || '',
            currentChapterTitle: data.currentChapterTitle || '',
            currentVolumeTitle: data.currentVolumeTitle || '',
          });
        } catch (err) {
          console.error(`Error reading ${indexMdPath}:`, err);
        }
      }
    }

    const sortedBooks = allBooks.sort((a, b) =>
      (b.publishDate || '').localeCompare(a.publishDate || '')
    );

    const booksByGenre: Record<string, Book[]> = {};
    const booksBySeries: Record<string, Book[]> = {};

    for (const book of sortedBooks) {
      for (const gName of book.genres) {
        if (!booksByGenre[gName]) booksByGenre[gName] = [];
        booksByGenre[gName].push(book);
      }

      // ৪. একাধিক সিরিজের জন্য লুপ চালিয়ে সকল সিরিজে বইটি অন্তর্ভুক্ত করা
      if (book.seriesList && book.seriesList.length > 0) {
        for (const sItem of book.seriesList) {
          const sName = sItem.name;
          if (!booksBySeries[sName]) booksBySeries[sName] = [];
          booksBySeries[sName].push(book);
        }
      } else if (typeof book.series === 'string' && book.series.trim()) {
        const sName = book.series.trim();
        if (!booksBySeries[sName]) booksBySeries[sName] = [];
        booksBySeries[sName].push(book);
      }
    }

    for (const sName in booksBySeries) {
      booksBySeries[sName].sort((a, b) => {
        const getOrder = (bObj: Book) => {
          if (bObj.seriesList) {
            const found = bObj.seriesList.find((s) => s.name === sName);
            return found?.order ? Number(found.order) : 0;
          }
          return bObj.series_order ? Number(bObj.series_order) : 0;
        };
        return getOrder(a) - getOrder(b);
      });
    }

    return { latestBooks: sortedBooks, booksByGenre, booksBySeries };
  } catch (error) {
    console.error('Library scanning error:', error);
    return { latestBooks: [], booksByGenre: {}, booksBySeries: {} };
  }
}

export async function getAllBooks(currentSubdomain?: string): Promise<Book[]> {
  const { latestBooks } = await getLibraryBooks(currentSubdomain);
  return latestBooks;
}

export async function getBookDirectoryBySlug(bookSlug: string): Promise<string | null> {
  if (!existsSync(booksDirectory)) return null;

  try {
    const authorItems = await fs.readdir(booksDirectory, { withFileTypes: true });

    for (const authorItem of authorItems) {
      if (!authorItem.isDirectory()) continue;

      const authorFolderPath = path.join(booksDirectory, authorItem.name);
      const bookItems = await fs.readdir(authorFolderPath, { withFileTypes: true });

      for (const bookItem of bookItems) {
        if (!bookItem.isDirectory()) continue;

        const bookFolderPath = path.join(authorFolderPath, bookItem.name);
        const indexMdPath = path.join(bookFolderPath, 'index.md');

        if (existsSync(indexMdPath)) {
          const fileContents = await fs.readFile(indexMdPath, 'utf8');
          const { data } = matter(fileContents);
          const fileSlug = data.slug ? String(data.slug).trim() : bookItem.name;

          if (fileSlug.toLowerCase() === bookSlug.toLowerCase()) {
            return bookFolderPath;
          }
        } else if (bookItem.name.toLowerCase() === bookSlug.toLowerCase()) {
          return bookFolderPath;
        }
      }
    }
    return null;
  } catch (err) {
    console.error(`Error resolving book directory for ${bookSlug}:`, err);
    return null;
  }
}

/**
 * ৩. বইয়ের হায়ারার্কি স্ক্যান করার আপডেটেড ফাংশন
 */
export async function getBookHierarchy(slug: string): Promise<{
  nodes: BookNode[];
  bookTitle: string;
  coverImage: string;
  volumes: VolumeItem[];
  directChapters: ChapterItem[];
}> {
  const bookDir = await getBookDirectoryBySlug(slug);
  const nodes: BookNode[] = [];
  const volumes: VolumeItem[] = [];
  const directChapters: ChapterItem[] = [];

  let bookTitle = slug;
  let coverImage = '/default-cover.jpg';

  if (!bookDir || !existsSync(bookDir)) {
    return { nodes, bookTitle, coverImage, volumes, directChapters };
  }

  const indexMdPath = path.join(bookDir, 'index.md');
  if (existsSync(indexMdPath)) {
    const { data } = matter(readFileSync(indexMdPath, 'utf8'));
    bookTitle = data.title || bookTitle;
    coverImage = data.cover_image || data.cover || coverImage;
  }

  const entries = readdirSync(bookDir, { withFileTypes: true });
  const hasSubVolumes = entries.some((e) => e.isDirectory());

  if (!hasSubVolumes) {
    // একক খণ্ডের বইয়ের জন্য
    const chapterFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name.toLowerCase() !== 'index.md')
      .map((e) => e.name)
      .sort(naturalSort);

    for (const chapFile of chapterFiles) {
      const chapFilePath = path.join(bookDir, chapFile);
      const { data } = matter(readFileSync(chapFilePath, 'utf8'));
      const chapSlug = chapFile.replace(/\.md$/, '');
      const title = data.title || chapSlug;
      const items = extractItemsFromData(data);

      directChapters.push({
        slug: chapSlug,
        title,
        item: data.item,
        items,
      });

      nodes.push({
        type: 'chapter',
        href: `/book/${slug}/${chapSlug}`,
        title,
        volId: '',
        chapterSlug: chapSlug,
        filePath: chapFilePath,
      });
    }
  } else {
    // বহুখণ্ডের বইয়ের জন্য
    const volumeFolders = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort(naturalSort);

    for (const volFolder of volumeFolders) {
      const volPath = path.join(bookDir, volFolder);

      const namedVolFilePath = path.join(volPath, `${volFolder}.md`);
      const indexVolFilePath = path.join(volPath, 'index.md');

      let volIndexPath = '';
      if (existsSync(namedVolFilePath)) {
        volIndexPath = namedVolFilePath;
      } else if (existsSync(indexVolFilePath)) {
        volIndexPath = indexVolFilePath;
      }

      let volTitle = volFolder.toUpperCase();

      if (volIndexPath) {
        const { data } = matter(readFileSync(volIndexPath, 'utf8'));
        volTitle = data.title || data.volume_title || volTitle;

        nodes.push({
          type: 'volume',
          href: `/book/${slug}/${volFolder}`,
          title: volTitle,
          volId: volFolder,
          filePath: volIndexPath,
        });
      }

      const chaptersDir = path.join(volPath, 'chapters');
      const hasChaptersFolder = existsSync(chaptersDir) && readdirSync(volPath, { withFileTypes: true }).some(e => e.isDirectory() && e.name === 'chapters');
      const targetDir = hasChaptersFolder ? chaptersDir : volPath;

      const chapFiles = readdirSync(targetDir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name.toLowerCase() !== 'index.md' && e.name !== `${volFolder}.md`)
        .map((e) => e.name)
        .sort(naturalSort);

      const volChapters: ChapterItem[] = [];

      for (const chapFile of chapFiles) {
        const chapFilePath = path.join(targetDir, chapFile);
        const { data } = matter(readFileSync(chapFilePath, 'utf8'));
        const chapSlug = chapFile.replace(/\.md$/, '');
        const title = data.title || `পরিচ্ছেদ ${chapSlug}`;
        const items = extractItemsFromData(data);

        volChapters.push({
          slug: chapSlug,
          title,
          item: data.item,
          items,
        });

        nodes.push({
          type: 'chapter',
          href: `/book/${slug}/${volFolder}/${chapSlug}`,
          title,
          volId: volFolder,
          chapterSlug: chapSlug,
          filePath: chapFilePath,
        });
      }

      volumes.push({
        id: volFolder,
        title: volTitle,
        chapters: volChapters,
      });
    }
  }

  return { nodes, bookTitle, coverImage, volumes, directChapters };
}

/**
 * ৪. নির্দিষ্ট বই, খণ্ড বা অধ্যায় ফেচ করার মূল ফাংশন
 */
export async function getBookBySlug(
  bookSlug: string,
  currentSubdomain?: string,
  volumeOrChapterSlug?: string,
  chapterSlug?: string
): Promise<BookDetail | null> {
  if (!existsSync(booksDirectory)) return null;

  try {
    const authorItems = await fs.readdir(booksDirectory, { withFileTypes: true });

    for (const authorItem of authorItems) {
      if (!authorItem.isDirectory()) continue;

      const authorFolderName = authorItem.name;
      const authorFolderPath = path.join(booksDirectory, authorFolderName);
      const bookItems = await fs.readdir(authorFolderPath, { withFileTypes: true });

      for (const bookItem of bookItems) {
        if (!bookItem.isDirectory()) continue;

        const bookFolderName = bookItem.name;
        const bookFolderPath = path.join(authorFolderPath, bookFolderName);
        const indexMdPath = path.join(bookFolderPath, 'index.md');

        if (!existsSync(indexMdPath)) continue;

        try {
          const mainIndexContents = await fs.readFile(indexMdPath, 'utf8');
          const { data: mainData } = matter(mainIndexContents);

          const fileSlug = mainData.slug ? String(mainData.slug).trim() : bookFolderName;

          if (fileSlug.toLowerCase() !== bookSlug.toLowerCase()) {
            continue;
          }

          const bookSubdomains = parseSubdomains(mainData.subdomain, authorFolderName);

          const { nodes, volumes, directChapters } = await getBookHierarchy(fileSlug);

          // জঁরা ও সিরিজ কেবল বইয়ের মূল index.md থেকেই গৃহিত
          const extractedGenres = extractGenresFromData(mainData);
          if (extractedGenres.length === 0) extractedGenres.push('অন্যান্য');

          let targetFilePath = indexMdPath;
          let currentVolTitle = '';
          let currentChapTitle = '';
          let targetNodeIndex = -1;

          if (volumeOrChapterSlug) {
            if (chapterSlug) {
              const matchedNodeIndex = nodes.findIndex(
                (n) =>
                  n.type === 'chapter' &&
                  n.volId.toLowerCase() === volumeOrChapterSlug.toLowerCase() &&
                  n.chapterSlug?.toLowerCase() === chapterSlug.toLowerCase()
              );
              if (matchedNodeIndex !== -1) {
                targetNodeIndex = matchedNodeIndex;
                targetFilePath = nodes[matchedNodeIndex].filePath;
                currentChapTitle = nodes[matchedNodeIndex].title;
                const parentVol = nodes.find(
                  (n) => n.type === 'volume' && n.volId === nodes[matchedNodeIndex].volId
                );
                if (parentVol) currentVolTitle = parentVol.title;
              }
            } else {
              const matchedNodeIndex = nodes.findIndex(
                (n) =>
                  (n.type === 'volume' && n.volId.toLowerCase() === volumeOrChapterSlug.toLowerCase()) ||
                  (n.type === 'chapter' && n.chapterSlug?.toLowerCase() === volumeOrChapterSlug.toLowerCase())
              );

              if (matchedNodeIndex !== -1) {
                targetNodeIndex = matchedNodeIndex;
                targetFilePath = nodes[matchedNodeIndex].filePath;
                if (nodes[matchedNodeIndex].type === 'volume') {
                  currentVolTitle = nodes[matchedNodeIndex].title;
                } else {
                  currentChapTitle = nodes[matchedNodeIndex].title;
                }
              }
            }
          }

          if (!existsSync(targetFilePath)) {
            targetFilePath = indexMdPath;
          }

          const fileContents = await fs.readFile(targetFilePath, 'utf8');
          const { data: pageData, content } = matter(fileContents);

          // আইটেম নির্ধারণ: চ্যাপ্টার/পাতার ফাইল থেকে; না থাকলে পুরো বই থেকে স্ক্যান করা
          let pageItems = extractItemsFromData(pageData);
          if (pageItems.length === 0 && targetFilePath !== indexMdPath) {
            pageItems = extractItemsFromData(pageData);
          } else if (targetFilePath === indexMdPath) {
            pageItems = collectChapterItemsDeep(bookFolderPath);
          }

          // নেভিগেশন লিঙ্ক নির্ধারণ লজিক
          let prevLink = '/books';
          let prevLabel = 'গ্রন্থাগার';
          let nextLink = '/books';
          let nextLabel = 'গ্রন্থাগার';

          if (targetNodeIndex === -1) {
            if (nodes.length > 0) {
              nextLink = nodes[0].href;
              nextLabel = nodes[0].title;
            }
          } else {
            if (targetNodeIndex > 0) {
              prevLink = nodes[targetNodeIndex - 1].href;
              prevLabel = nodes[targetNodeIndex - 1].title;
            } else {
              prevLink = `/book/${fileSlug}`;
              prevLabel = mainData.title || 'সূচিপত্র';
            }

            if (targetNodeIndex < nodes.length - 1) {
              nextLink = nodes[targetNodeIndex + 1].href;
              nextLabel = nodes[targetNodeIndex + 1].title;
            } else {
              nextLink = '/books';
              nextLabel = 'গ্রন্থাগার';
            }
          }

          const resolvedSubtitle = pageData.subtitle
            ? String(pageData.subtitle)
            : targetNodeIndex === -1 && mainData.subtitle
            ? String(mainData.subtitle)
            : '';

          const resolvedNotice = pageData.notice
            ? String(pageData.notice)
            : targetNodeIndex === -1 && mainData.notice
            ? String(mainData.notice)
            : '';

          // সিরিজ রেজোলিউশন (একমাত্র mainData থেকে)
          const extractedSeriesList = extractSeriesFromData(mainData);
          const seriesNames = extractedSeriesList.map((s) => s.name);
          const primarySeries = extractedSeriesList[0];

          // জঁরা লিঙ্ক রেজোলিউশন (একমাত্র mainData থেকে)
          const resolvedGenreLinks = generateGenreLinks(mainData.genre_links, extractedGenres);

          return {
            id: fileSlug,
            slug: fileSlug,
            title: mainData.title || 'শিরোনামহীন বই',
            subtitle: resolvedSubtitle,
            meta_title: pageData.meta_title || mainData.meta_title || '',
            meta_description: pageData.meta_description || mainData.meta_description || '',
            author: mainData.author || 'অজ্ঞাত লেখক',
            authorSlug: mainData.authorSlug || authorFolderName,
            translator: mainData.translator || '',
            translatorSlug: mainData.translatorSlug || '',
            editor: mainData.editor || '',
            editorSlug: mainData.editorSlug || '',
            subdomains: bookSubdomains,
            genres: extractedGenres,
            genre: mainData.genre || extractedGenres,
            genre_links: resolvedGenreLinks,
            items: pageItems,
            item: pageData.item || pageItems,
            series: seriesNames.length > 1 ? seriesNames : primarySeries?.name || '',
            seriesList: extractedSeriesList,
            seriesSlug: primarySeries?.slug || '',
            series_link: primarySeries?.link || '',
            series_order: primarySeries?.order || '',
            series_title: primarySeries?.title || mainData.series_title || '',
            series_info: extractedSeriesList.length > 1 ? extractedSeriesList : primarySeries,
            volumes: volumes.length > 0 ? volumes : mainData.volumes || [],
            directChapters: directChapters.length > 0 ? directChapters : mainData.directChapters || [],
            metaFiles: mainData.metaFiles || [],
            publishDate: mainData.published
              ? String(mainData.published)
              : mainData.date
              ? String(mainData.date)
              : '',
            published: mainData.published ? String(mainData.published) : '',
            first_published: mainData.first_published || '',
            publisher: mainData.publisher ? String(mainData.publisher) : '',
            cover: mainData.cover || mainData.cover_image || '',
            cover_image: mainData.cover_image || mainData.cover || '',
            source_book: mainData.source_book || '',
            pub_medium: mainData.pub_medium ? String(mainData.pub_medium) : '',
            notice: resolvedNotice,
            og_image: pageData.og_image || mainData.og_image || '',
            footnotes: pageData.footnotes || mainData.footnotes || [],
            chapter_title: pageData.chapter_title || currentChapTitle || '',
            volume_title: pageData.volume_title || currentVolTitle || '',
            currentChapterTitle: currentChapTitle || pageData.currentChapterTitle || '',
            currentVolumeTitle: currentVolTitle || pageData.currentVolumeTitle || '',
            prevLink,
            prevLabel,
            nextLink,
            nextLabel,
            content,
            rawFrontmatter: pageData,
          };
        } catch {
          continue;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching book with slug ${bookSlug}:`, error);
    return null;
  }
}