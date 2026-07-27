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
}

export interface VolumeItem {
  id: string;
  title: string;
  chapters?: ChapterItem[];
}

export interface MetaFileItem {
  slug: string;
  title: string;
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
  subdomains: string[];
  genres: string[];
  genre?: string | string[];
  genre_links?: Array<{ name: string; link: string }>;
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
 * বইয়ের ফোল্ডার থেকে গভীরে থাকা সকল .md ফাইল (অধ্যায়, কবিতা, গল্প ইত্যাদি) স্ক্যান করে
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
}> {
  const allBooks: Book[] = [];

  if (!existsSync(booksDirectory)) {
    return { latestBooks: [], booksByGenre: {} };
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

          allBooks.push({
            id: bookSlug,
            slug: bookSlug,
            title: data.title || 'শিরোনামহীন বই',
            subtitle: data.subtitle || '',
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
            author: data.author || 'অজ্ঞাত লেখক',
            authorSlug: data.authorSlug || authorFolderName,
            subdomains: bookSubdomains,
            genres: extractedGenres,
            genre: data.genre || extractedGenres,
            genre_links: data.genre_links || [],
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
    for (const book of sortedBooks) {
      for (const gName of book.genres) {
        if (!booksByGenre[gName]) booksByGenre[gName] = [];
        booksByGenre[gName].push(book);
      }
    }

    return { latestBooks: sortedBooks, booksByGenre };
  } catch (error) {
    console.error("Library scanning error:", error);
    return { latestBooks: [], booksByGenre: {} };
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
    // একক খণ্ডের বইয়ের জন্য (যেমন: ব্যথার দান)
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

      directChapters.push({ slug: chapSlug, title, genre: data.genre, genres });

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
    // বহুখণ্ডের বইয়ের জন্য (যেমন: দুর্গেশনন্দিনী)
    const volumeFolders = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort(naturalSort);

    for (const volFolder of volumeFolders) {
      const volPath = path.join(bookDir, volFolder);

      // 📌 ১. ভলিউমের নিজস্ব ফাইল চেক: v01/v01.md অথবা fallback v01/index.md
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

      // 📌 ২. চ্যাপ্টারগুলোর লোকেশন চেক: v01/chapters/ অথবা সরাসরি v01/
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

        volChapters.push({ slug: chapSlug, title, genre: data.genre, genres });

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

          // বইয়ের হায়ারার্কি ডাটা ফেচ করা
          const { nodes, volumes, directChapters } = await getBookHierarchy(fileSlug);

          // সর্বমোট ডাইনামিক জনরা ফেচিং (সকল সাব-ফাইল সহ)
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

          // সাবটাইটেল এবং নোটিশ শুধুমাত্র নির্দিষ্ট ফাইলে থাকলে দেখাবে (Fallback ওভাররাইড বন্ধ করা হয়েছে)
          const resolvedSubtitle = pageData.subtitle 
            ? String(pageData.subtitle) 
            : (targetNodeIndex === -1 && mainData.subtitle ? String(mainData.subtitle) : '');

          const resolvedNotice = pageData.notice 
            ? String(pageData.notice) 
            : (targetNodeIndex === -1 && mainData.notice ? String(mainData.notice) : '');

          return {
            id: fileSlug,
            slug: fileSlug,
            title: mainData.title || 'শিরোনামহীন বই',
            subtitle: resolvedSubtitle,
            meta_title: pageData.meta_title || mainData.meta_title || '',
            meta_description: pageData.meta_description || mainData.meta_description || '',
            author: mainData.author || 'অজ্ঞাত লেখক',
            authorSlug: mainData.authorSlug || authorFolderName,
            subdomains: bookSubdomains,
            genres: extractedGenres,
            genre: mainData.genre || extractedGenres,
            genre_links: mainData.genre_links || [],
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