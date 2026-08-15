import fs from 'fs/promises';
import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

// ==========================================
// 1. Core Interfaces & Types
// ==========================================

export interface ChapterItem {
  slug: string;
  title: string;
  genre?: string | string[]; 
  genres?: string[];         
  content?: string;
  series?: string;
  seriesSlug?: string;
  series_order?: number | string;
}

export interface VolumeItem {
  id: string;
  title: string;
  chapters?: ChapterItem[];
  series?: string;
  seriesSlug?: string;
  series_order?: number | string;
}

export interface MetaFileItem {
  slug: string;
  title: string;
}

export interface SeriesItem {
  name: string;
  slug: string;
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
  series?: string;
  seriesSlug?: string;
  series_order?: number | string;
  series_title?: string;
  series_info?: SeriesItem;
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
  series?: string;
  seriesSlug?: string;
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
  const genresSet = new Set<string>();

  if (!data) return [];

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
 * বইয়ের ফোল্ডার থেকে গভীরে থাকা সকল .md ফাইল স্ক্যান করে
 * ডাইনামিকালি সব Genre সংগ্রহ করার ইউনিভার্সাল হেল্পার
 */
function collectGenresDeep(data: any, bookFolderPath?: string): string[] {
  const genresSet = new Set<string>();

  // ১. মূল index.md-এর জনরা যোগ
  extractGenresFromData(data).forEach((g) => genresSet.add(g));

  // ২. volumes/directChapters অবজেক্টের ভেতরের জনরা যোগ
  const scanObj = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    extractGenresFromData(obj).forEach((g) => genresSet.add(g));

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object') {
        scanObj(obj[key]);
      }
    }
  };

  if (data.volumes) scanObj(data.volumes);
  if (data.directChapters) scanObj(data.directChapters);

  // ৩. ফিজিক্যাল ফোল্ডার স্ক্যান করে ভেতরের সব ফাইল থেকে জনরা রিড করা
  if (bookFolderPath && existsSync(bookFolderPath)) {
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
              extractGenresFromData(fileData).forEach((g) => genresSet.add(g));
            } catch {
              // ফাইল রিড ট্রাই-ক্যাচ
            }
          }
        }
      };
      scanDir(bookFolderPath);
    } catch {
      // ডিরেক্টরি ট্রাভার্সাল ট্রাই-ক্যাচ
    }
  }

  const result = Array.from(genresSet);
  return result.length > 0 ? result : ['অন্যান্য'];
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

          // গভীর স্ক্যান সহ সকল জনরা সংগ্রহ করা
          const extractedGenres = collectGenresDeep(data, bookFolderPath);

          const bookSlug = data.slug ? String(data.slug).trim() : bookFolderName;

          // সিরিজ সংক্রান্ত ডাটা সঠিকভাবে প্রস্তুত করা
          const seriesName = data.series ? String(data.series).trim() : '';
          const seriesSlugVal = data.seriesSlug ? String(data.seriesSlug).trim() : slugify(seriesName);
          const seriesOrderVal = data.series_order || data.series_index || '';

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
            genres: extractedGenres,
            genre: data.genre || extractedGenres,
            genre_links: data.genre_links || [],
            series: seriesName,
            seriesSlug: seriesSlugVal,
            series_order: seriesOrderVal,
            series_title: data.series_title || '',
            series_info: seriesName ? {
              name: seriesName,
              slug: seriesSlugVal,
              order: seriesOrderVal,
              title: data.series_title || ''
            } : undefined,
            volumes: data.volumes || [],
            directChapters: data.directChapters || [],
            metaFiles: data.metaFiles || [],
            publishDate: data.published ? String(data.published) : (data.date ? String(data.date) : ''),
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
      // জনরা ভিত্তিক গ্রুপিং
      for (const gName of book.genres) {
        if (!booksByGenre[gName]) booksByGenre[gName] = [];
        booksByGenre[gName].push(book);
      }

      // সিরিজ ভিত্তিক গ্রুপিং
      if (book.series) {
        const sName = book.series;
        if (!booksBySeries[sName]) booksBySeries[sName] = [];
        booksBySeries[sName].push(book);
      }
    }

    // সিরিজের বইগুলোকে ক্রম (series_order) অনুযায়ী সর্ট করা
    for (const sName in booksBySeries) {
      booksBySeries[sName].sort((a, b) => {
        const orderA = a.series_order ? Number(a.series_order) : 0;
        const orderB = b.series_order ? Number(b.series_order) : 0;
        return orderA - orderB;
      });
    }

    return { latestBooks: sortedBooks, booksByGenre, booksBySeries };
  } catch (error) {
    console.error("Library scanning error:", error);
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
 * ৩. বইয়ের হায়ারার্কি স্ক্যান করার আপডেটেড ফাংশন (একক ও বহুখণ্ডের বইয়ের জন্য)
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
  const hasSubVolumes = entries.some(e => e.isDirectory());

  if (!hasSubVolumes) {
    // একক খণ্ডের বইয়ের জন্য
    const chapterFiles = entries
      .filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== 'index.md')
      .map(e => e.name)
      .sort(naturalSort);

    for (const chapFile of chapterFiles) {
      const chapFilePath = path.join(bookDir, chapFile);
      const { data } = matter(readFileSync(chapFilePath, 'utf8'));
      const chapSlug = chapFile.replace(/\.md$/, '');
      const title = data.title || chapSlug;
      const genres = extractGenresFromData(data);

      const sName = data.series ? String(data.series).trim() : undefined;
      const sSlug = data.seriesSlug ? String(data.seriesSlug).trim() : (sName ? slugify(sName) : undefined);

      directChapters.push({ 
        slug: chapSlug, 
        title, 
        genre: data.genre, 
        genres,
        series: sName,
        seriesSlug: sSlug,
        series_order: data.series_order
      });

      nodes.push({
        type: 'chapter',
        href: `/book/${slug}/${chapSlug}`,
        title,
        volId: '',
        chapterSlug: chapSlug,
        filePath: chapFilePath,
        series: sName,
        seriesSlug: sSlug,
        series_order: data.series_order
      });
    }
  } else {
    // বহুখণ্ডের বইয়ের জন্য
    const volumeFolders = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
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
      let volData: any = {};

      if (volIndexPath) {
        const { data } = matter(readFileSync(volIndexPath, 'utf8'));
        volData = data;
        volTitle = data.title || data.volume_title || volTitle;

        const sName = data.series ? String(data.series).trim() : undefined;
        const sSlug = data.seriesSlug ? String(data.seriesSlug).trim() : (sName ? slugify(sName) : undefined);

        nodes.push({
          type: 'volume',
          href: `/book/${slug}/${volFolder}`,
          title: volTitle,
          volId: volFolder,
          filePath: volIndexPath,
          series: sName,
          seriesSlug: sSlug,
          series_order: data.series_order
        });
      }

      const chaptersDir = path.join(volPath, 'chapters');
      const hasChaptersFolder = existsSync(chaptersDir) && statSync(chaptersDir).isDirectory();
      const targetDir = hasChaptersFolder ? chaptersDir : volPath;

      const chapFiles = readdirSync(targetDir)
        .filter(f => f.endsWith('.md') && f !== 'index.md' && f !== `${volFolder}.md`)
        .sort(naturalSort);

      const volChapters: ChapterItem[] = [];

      for (const chapFile of chapFiles) {
        const chapFilePath = path.join(targetDir, chapFile);
        const { data } = matter(readFileSync(chapFilePath, 'utf8'));
        const chapSlug = chapFile.replace(/\.md$/, '');
        const title = data.title || `পরিচ্ছেদ ${chapSlug}`;
        const genres = extractGenresFromData(data);

        const sName = data.series ? String(data.series).trim() : undefined;
        const sSlug = data.seriesSlug ? String(data.seriesSlug).trim() : (sName ? slugify(sName) : undefined);

        volChapters.push({ 
          slug: chapSlug, 
          title, 
          genre: data.genre, 
          genres,
          series: sName,
          seriesSlug: sSlug,
          series_order: data.series_order
        });

        nodes.push({
          type: 'chapter',
          href: `/book/${slug}/${volFolder}/${chapSlug}`,
          title,
          volId: volFolder,
          chapterSlug: chapSlug,
          filePath: chapFilePath,
          series: sName,
          seriesSlug: sSlug,
          series_order: data.series_order
        });
      }

      const volSName = volData.series ? String(volData.series).trim() : undefined;
      const volSSlug = volData.seriesSlug ? String(volData.seriesSlug).trim() : (volSName ? slugify(volSName) : undefined);

      volumes.push({
        id: volFolder,
        title: volTitle,
        chapters: volChapters,
        series: volSName,
        seriesSlug: volSSlug,
        series_order: volData.series_order
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

          const extractedGenres = collectGenresDeep(mainData, bookFolderPath);

          let targetFilePath = indexMdPath;
          let currentVolTitle = '';
          let currentChapTitle = '';
          let targetNodeIndex = -1;

          if (volumeOrChapterSlug) {
            if (chapterSlug) {
              const matchedNodeIndex = nodes.findIndex(
                n => n.type === 'chapter' &&
                     n.volId.toLowerCase() === volumeOrChapterSlug.toLowerCase() &&
                     n.chapterSlug?.toLowerCase() === chapterSlug.toLowerCase()
              );
              if (matchedNodeIndex !== -1) {
                targetNodeIndex = matchedNodeIndex;
                targetFilePath = nodes[matchedNodeIndex].filePath;
                currentChapTitle = nodes[matchedNodeIndex].title;
                const parentVol = nodes.find(n => n.type === 'volume' && n.volId === nodes[matchedNodeIndex].volId);
                if (parentVol) currentVolTitle = parentVol.title;
              }
            } else {
              const matchedNodeIndex = nodes.findIndex(
                n => (n.type === 'volume' && n.volId.toLowerCase() === volumeOrChapterSlug.toLowerCase()) ||
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

          // নেভিগেশন লিঙ্ক নির্ধারণ লজিক
          let prevLink = "/books";
          let prevLabel = "গ্রন্থাগার";
          let nextLink = "/books";
          let nextLabel = "গ্রন্থাগার";

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
              nextLink = "/books";
              nextLabel = "গ্রন্থাগার";
            }
          }

          const resolvedSubtitle = pageData.subtitle 
            ? String(pageData.subtitle) 
            : (targetNodeIndex === -1 && mainData.subtitle ? String(mainData.subtitle) : '');

          const resolvedNotice = pageData.notice 
            ? String(pageData.notice) 
            : (targetNodeIndex === -1 && mainData.notice ? String(mainData.notice) : '');

          // সিরিজ রেজোলিউশন
          const resolvedSeries = pageData.series || mainData.series || '';
          const resolvedSeriesName = resolvedSeries ? String(resolvedSeries).trim() : '';
          const resolvedSeriesSlug = pageData.seriesSlug || mainData.seriesSlug 
            ? String(pageData.seriesSlug || mainData.seriesSlug).trim() 
            : slugify(resolvedSeriesName);

          const resolvedSeriesOrder = pageData.series_order || pageData.series_index || mainData.series_order || mainData.series_index || '';
          const resolvedSeriesTitle = pageData.series_title || mainData.series_title || '';

          return {
            id: fileSlug,
            slug: fileSlug,
            title: mainData.title || 'শিরোনামহীন বই',
            subtitle: resolvedSubtitle,
            meta_title: pageData.meta_title || mainData.meta_title || '',
            meta_description: pageData.meta_description || mainData.meta_description || '',
            author: pageData.author || mainData.author || 'অজ্ঞাত লেখক',
            authorSlug: pageData.authorSlug || mainData.authorSlug || authorFolderName,
            translator: pageData.translator || mainData.translator || '',
            translatorSlug: pageData.translatorSlug || mainData.translatorSlug || '',
            editor: pageData.editor || mainData.editor || '',
            editorSlug: pageData.editorSlug || mainData.editorSlug || '',
            subdomains: bookSubdomains,
            genres: extractedGenres,
            genre: mainData.genre || extractedGenres,
            genre_links: mainData.genre_links || [],
            series: resolvedSeriesName,
            seriesSlug: resolvedSeriesSlug,
            series_order: resolvedSeriesOrder,
            series_title: resolvedSeriesTitle,
            series_info: resolvedSeriesName ? {
              name: resolvedSeriesName,
              slug: resolvedSeriesSlug,
              order: resolvedSeriesOrder,
              title: resolvedSeriesTitle,
            } : undefined,
            volumes: volumes.length > 0 ? volumes : (mainData.volumes || []),
            directChapters: directChapters.length > 0 ? directChapters : (mainData.directChapters || []),
            metaFiles: mainData.metaFiles || [],
            publishDate: mainData.published ? String(mainData.published) : (mainData.date ? String(mainData.date) : ''),
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