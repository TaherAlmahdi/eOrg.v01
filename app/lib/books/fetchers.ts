import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Book } from './types';
import { booksDirectory, parseNumericOrder, parseSubdomains } from './utils';
import {
  collectChapterItemsDeep,
  extractGenresFromData,
  extractSeriesFromData,
  generateGenreLinks,
} from './extractors';

// ==========================================
// Helper Functions
// ==========================================

/**
 * বইয়ের স্লাগ নির্ধারণের প্রধান লজিক:
 * ১. index.md এর Frontmatter-এ 'slug' থাকলে সেটি ব্যবহৃত হবে।
 * ২. 'slug' না থাকলে সরাসরি বইয়ের ফোল্ডারের নাম (folderName) ব্যবহৃত হবে।
 */
function getEffectiveSlug(data: Record<string, any>, folderName: string): string {
  if (data && data.slug !== undefined && data.slug !== null) {
    const trimmedSlug = String(data.slug).trim();
    if (trimmedSlug.length > 0) {
      return trimmedSlug;
    }
  }
  return folderName;
}

// ==========================================
// Main Data Fetching Functions
// ==========================================

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

          const bookGenres = extractGenresFromData(data);
          if (bookGenres.length === 0) bookGenres.push('অন্যান্য');

          const extractedItems = collectChapterItemsDeep(bookFolderPath);

          // স্লাগ নির্ধারণ
          const bookSlug = getEffectiveSlug(data, bookFolderName);

          const extractedSeriesList = extractSeriesFromData(data);
          const seriesNames = extractedSeriesList.map((s) => s.name);
          const primarySeries = extractedSeriesList[0];
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
            series_order: primarySeries?.order ?? data.series_order ?? '',
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

    // সিریز সোর্টিং লজিক
    for (const sName in booksBySeries) {
      booksBySeries[sName].sort((a, b) => {
        const getOrderVal = (book: Book): number | null => {
          if (book.seriesList && book.seriesList.length > 0) {
            const found = book.seriesList.find((s) => s.name === sName);
            if (found && found.order !== undefined && found.order !== '') {
              const parsed = parseNumericOrder(found.order);
              if (parsed !== null) return parsed;
            }
          }
          if (book.series_order !== undefined && book.series_order !== '') {
            const parsed = parseNumericOrder(book.series_order);
            if (parsed !== null) return parsed;
          }
          return null;
        };

        const getPublishedVal = (book: Book): string => {
          return (book.first_published || book.publishDate || book.published || '').toString().trim();
        };

        const orderA = getOrderVal(a);
        const orderB = getOrderVal(b);

        if (orderA !== null && orderB !== null) {
          return orderA - orderB;
        }

        if (orderA !== null) return -1;
        if (orderB !== null) return 1;

        const pubA = getPublishedVal(a);
        const pubB = getPublishedVal(b);

        if (pubA && pubB) {
          const pubCompare = pubA.localeCompare(pubB, 'bn', { numeric: true });
          if (pubCompare !== 0) return pubCompare;
        }
        if (pubA) return -1;
        if (pubB) return 1;

        return (a.title || '').localeCompare(b.title || '', 'bn');
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

    const targetSlug = decodeURIComponent(bookSlug).toLowerCase();

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

          const fileSlug = getEffectiveSlug(data, bookItem.name).toLowerCase();

          if (
            fileSlug === targetSlug ||
            encodeURIComponent(fileSlug).toLowerCase() === targetSlug
          ) {
            return bookFolderPath;
          }
        } else if (
          bookItem.name.toLowerCase() === targetSlug ||
          encodeURIComponent(bookItem.name).toLowerCase() === targetSlug
        ) {
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