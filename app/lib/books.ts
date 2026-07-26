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
  metaFiles?: MetaFileItem[]; // metaFiles সরাসরি বুক টাইপে যুক্ত করা হলো
  publishDate?: string;
  published?: string;
  first_published?: string | number;
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
  rawFrontmatter: Record<string, unknown>; // 'any'-এর পরিবর্তে নিরাপদ 'unknown'
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
 * স্ট্রিম/স্ট্রিং থেকে সাবডোমেন অ্যারে বের করার হেল্পার (Type-safe)
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

// ==========================================
// 3. Main Data Fetching Functions
// ==========================================

/**
 * ১. লাইব্রেরি বা সাবডোমেন ভিত্তিক বইয়ের তালিকা ফেচ করা
 */
export async function getLibraryBooks(currentSubdomain?: string): Promise<{ 
  latestBooks: Book[]; 
  booksByGenre: Record<string, Book[]> 
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
        const indexMdPath = path.join(authorFolderPath, bookFolderName, 'index.md');

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

          let extractedGenres: string[] = ['অন্যান্য'];
          if (data.genre || data.genres) {
            const raw = data.genre || data.genres;
            extractedGenres = Array.isArray(raw) ? raw : [raw];
          }

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

/**
 * ২. নির্দিষ্ট বই, খণ্ড বা অধ্যায় ফেচ করার ফাংশন 
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

          let extractedGenres: string[] = ['অন্যান্য'];
          if (mainData.genre || mainData.genres) {
            const raw = mainData.genre || mainData.genres;
            extractedGenres = Array.isArray(raw) ? raw : [raw];
          }

          // ৩. হায়ারার্কি নোডসমূহ ফেচ করা
          const { nodes } = await getBookHierarchy(fileSlug);

          let targetFilePath = indexMdPath;
          let currentVolTitle = '';
          let currentChapTitle = '';
          let targetNodeIndex = -1;

          if (volumeOrChapterSlug) {
            if (chapterSlug) {
              const matchedNodeIndex = nodes.findIndex(
                n => n.type === 'chapter' && n.volId.toLowerCase() === volumeOrChapterSlug.toLowerCase() && n.chapterSlug?.toLowerCase() === chapterSlug.toLowerCase()
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

          // 🎯 নেভিগেশন লিঙ্ক ক্যালকুলেশন
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

          return {
            id: fileSlug,
            slug: fileSlug,
            title: mainData.title || 'শিরোনামহীন বই',
            subtitle: pageData.subtitle || mainData.subtitle || '',
            meta_title: pageData.meta_title || mainData.meta_title || '',
            meta_description: pageData.meta_description || mainData.meta_description || '',
            author: mainData.author || 'অজ্ঞাত লেখক',
            authorSlug: mainData.authorSlug || authorFolderName,
            subdomains: bookSubdomains,
            genres: extractedGenres,
            genre: mainData.genre || extractedGenres,
            genre_links: mainData.genre_links || [],
            volumes: mainData.volumes || [],
            directChapters: mainData.directChapters || [],
            metaFiles: mainData.metaFiles || [],
            publishDate: mainData.published ? String(mainData.published) : (mainData.date ? String(mainData.date) : ''),
            published: mainData.published ? String(mainData.published) : '',
            first_published: mainData.first_published || '',
            cover: mainData.cover || mainData.cover_image || '',
            cover_image: mainData.cover_image || mainData.cover || '',
            source_book: mainData.source_book || '',
            pub_medium: mainData.pub_medium ? String(mainData.pub_medium) : '',
            notice: pageData.notice || mainData.notice ? String(pageData.notice || mainData.notice) : '',
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

export async function getBookHierarchy(slug: string): Promise<{
  nodes: BookNode[];
  bookTitle: string;
  coverImage: string;
}> {
  const bookDir = await getBookDirectoryBySlug(slug);
  const nodes: BookNode[] = [];

  let bookTitle = slug;
  let coverImage = '/default-cover.jpg';

  if (!bookDir || !existsSync(bookDir)) {
    return { nodes, bookTitle, coverImage };
  }

  const indexMdPath = path.join(bookDir, 'index.md');
  if (existsSync(indexMdPath)) {
    const { data } = matter(readFileSync(indexMdPath, 'utf8'));
    bookTitle = data.title || bookTitle;
    coverImage = data.cover_image || data.cover || coverImage;
  }

  const volumes = readdirSync(bookDir)
    .filter(file => statSync(path.join(bookDir, file)).isDirectory())
    .sort();

  for (const vol of volumes) {
    const volPath = path.join(bookDir, vol);

    const volFiles = readdirSync(volPath)
      .filter(f => f.endsWith('.md') && statSync(path.join(volPath, f)).isFile())
      .sort();

    let volTitle = vol.toUpperCase();
    let volFilePath = '';
    let primaryVolMdName = '';

    if (volFiles.length > 0) {
      primaryVolMdName = volFiles[0];
      volFilePath = path.join(volPath, primaryVolMdName);
      const { data } = matter(readFileSync(volFilePath, 'utf8'));
      volTitle = data.title || volTitle;
    }

    nodes.push({
      type: 'volume',
      href: `/book/${slug}/${vol}`,
      title: volTitle,
      volId: vol,
      filePath: volFilePath,
    });

    const chaptersDir = path.join(volPath, 'chapters');
    const hasChaptersFolder = existsSync(chaptersDir) && statSync(chaptersDir).isDirectory();
    const targetDir = hasChaptersFolder ? chaptersDir : volPath;

    if (existsSync(targetDir)) {
      const chapterFiles = readdirSync(targetDir)
        .filter(f => {
          const isMd = f.endsWith('.md') && statSync(path.join(targetDir, f)).isFile();
          if (!hasChaptersFolder) {
            return isMd && f !== primaryVolMdName;
          }
          return isMd;
        })
        .sort();

      for (const chapFile of chapterFiles) {
        const chapFilePath = path.join(targetDir, chapFile);
        const { data } = matter(readFileSync(chapFilePath, 'utf8'));
        const chapSlug = chapFile.replace('.md', '');

        nodes.push({
          type: 'chapter',
          href: `/book/${slug}/${vol}/${chapSlug}`,
          title: data.title || `পরিচ্ছেদ ${chapSlug.replace(/^c/i, '')}`,
          volId: vol,
          chapterSlug: chapSlug,
          filePath: chapFilePath,
        });
      }
    }
  }

  return { nodes, bookTitle, coverImage };
}