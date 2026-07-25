import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
  volumes?: Array<{ id: string; title: string }>;
  directChapters?: Array<{ slug: string; title: string }>;
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
}

export interface BookDetail extends Book {
  content: string;
  rawFrontmatter: Record<string, any>;
}

const booksDirectory = path.resolve(process.cwd(), 'content', 'books');

/**
 * স্ট্রিম/স্ট্রিং থেকে সাবডোমেন অ্যারে বের করার হেল্পার
 */
function parseSubdomains(subdomainRaw: any, defaultAuthorFolder: string): string[] {
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

          // সাবডোমেন ফিল্টারিং
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

          const bookSlug = data.slug || bookFolderName;

          allBooks.push({
            id: `${authorFolderName}-${bookFolderName}`,
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
 * ২. নির্দিষ্ট বই ফেচ করার ফাংশন (Frontmatter-এর subdomain এবং slug মিলিয়ে)
 */
export async function getBookBySlug(bookSlug: string, currentSubdomain?: string): Promise<BookDetail | null> {
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
        const indexMdPath = path.join(authorFolderPath, bookFolderName, 'index.md');

        if (!existsSync(indexMdPath)) continue;

        try {
          const fileContents = await fs.readFile(indexMdPath, 'utf8');
          const { data, content } = matter(fileContents);

          const fileSlug = data.slug || bookFolderName;

          // ১. স্লাগ চেক করা
          if (fileSlug.toLowerCase() !== bookSlug.toLowerCase()) {
            continue;
          }

          const bookSubdomains = parseSubdomains(data.subdomain, authorFolderName);

          let extractedGenres: string[] = ['অন্যান্য'];
          if (data.genre || data.genres) {
            const raw = data.genre || data.genres;
            extractedGenres = Array.isArray(raw) ? raw : [raw];
          }

          return {
            id: `${authorFolderName}-${bookFolderName}`,
            slug: fileSlug,
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
            content,
            rawFrontmatter: data,
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