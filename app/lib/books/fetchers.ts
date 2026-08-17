import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Book, BookDetail } from './types';
import {
  booksDirectory,
  parseSubdomains,
  extractGenresFromData,
  extractSeriesFromData,
  generateGenreLinks,
  collectChapterItemsDeep,
  extractItemsFromData,
} from './utils';
import { getBookHierarchy } from './hierarchy';

// ==========================================
// Helper Functions
// ==========================================

/**
 * সাবডোমেন ফিল্টারিং লজিক চেক করার হেল্পার
 */
function isSubdomainAllowed(bookSubdomains: string[], currentSubdomain?: string): boolean {
  if (!currentSubdomain) return true;
  const normalizedSubdomain = currentSubdomain.toLowerCase();
  if (['main', 'www'].includes(normalizedSubdomain)) return true;
  return bookSubdomains.includes(normalizedSubdomain);
}

/**
 * সমস্ত লেখক ও বইয়ের ডিরেক্টরি পাথ একত্রে রিটার্ন করে
 */
async function getAllBookFolders(): Promise<Array<{ authorFolder: string; bookFolder: string; bookPath: string }>> {
  if (!existsSync(booksDirectory)) return [];

  const bookFolders: Array<{ authorFolder: string; bookFolder: string; bookPath: string }> = [];
  const authorItems = await fs.readdir(booksDirectory, { withFileTypes: true });

  for (const authorItem of authorItems) {
    if (!authorItem.isDirectory()) continue;

    const authorFolderPath = path.join(booksDirectory, authorItem.name);
    const bookItems = await fs.readdir(authorFolderPath, { withFileTypes: true });

    for (const bookItem of bookItems) {
      if (!bookItem.isDirectory()) continue;

      bookFolders.push({
        authorFolder: authorItem.name,
        bookFolder: bookItem.name,
        bookPath: path.join(authorFolderPath, bookItem.name),
      });
    }
  }

  return bookFolders;
}

/**
 * ফ্রন্টম্যাটার ডাটা থেকে বেসিক Book অবজেক্ট তৈরি করার রিইউজেবল হেল্পার
 */
function mapBookData(
  data: Record<string, any>,
  authorFolderName: string,
  bookFolderName: string,
  extractedItems: any[]
): Book {
  const bookSlug = data.slug ? String(data.slug).trim() : bookFolderName;
  const bookSubdomains = parseSubdomains(data.subdomain, authorFolderName);
  const bookGenres = extractGenresFromData(data);
  if (bookGenres.length === 0) bookGenres.push('অন্যান্য');

  const extractedSeriesList = extractSeriesFromData(data);
  const seriesNames = extractedSeriesList.map((s) => s.name);
  const primarySeries = extractedSeriesList[0];
  const genreLinksVal = generateGenreLinks(data.genre_links, bookGenres);

  return {
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
  };
}

/**
 * হাইরার্কি নোড থেকে নির্দিষ্ট চ্যাপ্টার/ভলিউম মিলানোর হেল্পার
 */
function findTargetNodeIndex(
  nodes: any[],
  volumeOrChapterSlug?: string,
  chapterSlug?: string
): number {
  if (!volumeOrChapterSlug) return -1;

  const targetVolOrChap = volumeOrChapterSlug.toLowerCase();

  if (chapterSlug) {
    const targetChap = chapterSlug.toLowerCase();
    return nodes.findIndex(
      (n) =>
        n.type === 'chapter' &&
        n.volId.toLowerCase() === targetVolOrChap &&
        n.chapterSlug?.toLowerCase() === targetChap
    );
  }

  return nodes.findIndex(
    (n) =>
      (n.type === 'volume' && n.volId.toLowerCase() === targetVolOrChap) ||
      (n.type === 'chapter' && n.chapterSlug?.toLowerCase() === targetVolOrChap)
  );
}

// ==========================================
// Main Exported Functions
// ==========================================

export async function getLibraryBooks(currentSubdomain?: string): Promise<{
  latestBooks: Book[];
  booksByGenre: Record<string, Book[]>;
  booksBySeries: Record<string, Book[]>;
}> {
  const allBooks: Book[] = [];

  try {
    const bookFolders = await getAllBookFolders();

    for (const { authorFolder, bookFolder, bookPath } of bookFolders) {
      const indexMdPath = path.join(bookPath, 'index.md');
      if (!existsSync(indexMdPath)) continue;

      try {
        const fileContents = await fs.readFile(indexMdPath, 'utf8');
        const { data } = matter(fileContents);

        const bookSubdomains = parseSubdomains(data.subdomain, authorFolder);
        if (!isSubdomainAllowed(bookSubdomains, currentSubdomain)) continue;

        const extractedItems = collectChapterItemsDeep(bookPath);
        const book = mapBookData(data, authorFolder, bookFolder, extractedItems);

        allBooks.push(book);
      } catch (err) {
        console.error(`Error reading ${indexMdPath}:`, err);
      }
    }

    // প্রকাশনার তারিখ অনুযায়ী সর্টিং
    const sortedBooks = allBooks.sort((a, b) =>
      (b.publishDate || '').localeCompare(a.publishDate || '')
    );

    // জেনার ও সিরিজ অনুযায়ী গ্রুপিং
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

    // সিরিজের ক্রম অনুসারে বই সর্টিং
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

export async function getBookBySlug(
  bookSlug: string,
  currentSubdomain?: string,
  volumeOrChapterSlug?: string,
  chapterSlug?: string
): Promise<BookDetail | null> {
  try {
    const bookFolders = await getAllBookFolders();

    for (const { authorFolder, bookFolder, bookPath } of bookFolders) {
      const indexMdPath = path.join(bookPath, 'index.md');
      if (!existsSync(indexMdPath)) continue;

      try {
        const mainIndexContents = await fs.readFile(indexMdPath, 'utf8');
        const { data: mainData } = matter(mainIndexContents);

        const fileSlug = mainData.slug ? String(mainData.slug).trim() : bookFolder;
        if (fileSlug.toLowerCase() !== bookSlug.toLowerCase()) continue;

        const bookSubdomains = parseSubdomains(mainData.subdomain, authorFolder);
        if (!isSubdomainAllowed(bookSubdomains, currentSubdomain)) continue;

        const { nodes, volumes, directChapters } = await getBookHierarchy(fileSlug);
        const targetNodeIndex = findTargetNodeIndex(nodes, volumeOrChapterSlug, chapterSlug);

        let targetFilePath = indexMdPath;
        let currentVolTitle = '';
        let currentChapTitle = '';

        if (targetNodeIndex !== -1) {
          const matchedNode = nodes[targetNodeIndex];
          targetFilePath = matchedNode.filePath;

          if (matchedNode.type === 'volume') {
            currentVolTitle = matchedNode.title;
          } else {
            currentChapTitle = matchedNode.title;
            const parentVol = nodes.find((n) => n.type === 'volume' && n.volId === matchedNode.volId);
            if (parentVol) currentVolTitle = parentVol.title;
          }
        }

        if (!existsSync(targetFilePath)) {
          targetFilePath = indexMdPath;
        }

        const fileContents = await fs.readFile(targetFilePath, 'utf8');
        const { data: pageData, content } = matter(fileContents);

        // আইটেমস রিট্রিভ করা
        let pageItems = extractItemsFromData(pageData);
        if (pageItems.length === 0 && targetFilePath !== indexMdPath) {
          pageItems = extractItemsFromData(pageData);
        } else if (targetFilePath === indexMdPath) {
          pageItems = collectChapterItemsDeep(bookPath);
        }

        // নেভিগেশন লিংক তৈরি (Previous / Next)
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
          }
        }

        // বেস বুক ডাটা মেপিং
        const baseBook = mapBookData(
          mainData,
          authorFolder,
          bookFolder,
          pageItems
        );

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

        return {
          ...baseBook,
          subtitle: resolvedSubtitle,
          meta_title: pageData.meta_title || mainData.meta_title || '',
          meta_description: pageData.meta_description || mainData.meta_description || '',
          items: pageItems,
          item: pageData.item || pageItems,
          volumes: volumes.length > 0 ? volumes : mainData.volumes || [],
          directChapters: directChapters.length > 0 ? directChapters : mainData.directChapters || [],
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

    return null;
  } catch (error) {
    console.error(`Error fetching book with slug ${bookSlug}:`, error);
    return null;
  }
}