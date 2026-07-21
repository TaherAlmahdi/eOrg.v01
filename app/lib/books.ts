// d:/SOFTWARE/eOrg.v02/lib/books.ts
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// ১. ফ্রন্টম্যাটারের নতুন ফিল্ডগুলোসহ ইন্টারফেস আপডেট
export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  genres: string[];
  publishDate?: string;
  published?: string;           // সাইটে যুক্ত করার তারিখ/স্ট্রিং
  first_published?: string | number; // আসল বই প্রকাশের প্রথম সাল
  cover?: string;              // প্রচ্ছদের পাথ
  source_book?: string;        // যে সংস্করণ বা উৎস থেকে বইটি সংগৃহীত
  pub_medium?: string;         // প্রথম প্রকাশ মাধ্যম/পত্রিকার নাম
  notice?: string;             // বিশেষ কোনো নোটিশ বা বার্তা
}

export async function getLibraryBooks(): Promise<{ latestBooks: Book[]; booksByGenre: Record<string, Book[]> }> {
  const booksDirectory = path.join(process.cwd(), 'content', 'books');
  const allBooks: Book[] = [];

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

        try {
          const fileContents = await fs.readFile(indexMdPath, 'utf8');
          const { data } = matter(fileContents);
          
          let extractedGenres: string[] = ['অন্যান্য'];
          if (data.genre || data.genres) {
            const raw = data.genre || data.genres;
            extractedGenres = Array.isArray(raw) ? raw : [raw];
          }
          
          // ২. ফ্রন্টম্যাটার থেকে আসা সমস্ত ফিল্ড ম্যাপিং
          allBooks.push({
            id: `${authorFolderName}-${bookFolderName}`,
            slug: bookFolderName,
            title: data.title || 'শিরোনামহীন বই',
            author: data.author || 'অজ্ঞাত লেখক',
            genres: extractedGenres,
            publishDate: data.published ? String(data.published) : (data.date ? String(data.date) : ''),
            published: data.published ? String(data.published) : '',
            first_published: data.first_published || '',
            cover: data.cover || data.cover_image || '',
            source_book: data.source_book ? String(data.source_book) : '',
            pub_medium: data.pub_medium ? String(data.pub_medium) : '',
            notice: data.notice ? String(data.notice) : '',
          });
        } catch {
          continue;
        }
      }
    }

    // সাইটে যুক্ত হওয়ার তারিখ অনুসারে সাজানো (সবচেয়ে নতুন যুক্ত হওয়া বইগুলো আগে আসবে)
    const sortedBooks = allBooks.sort((a, b) => 
      (b.publishDate || '').localeCompare(a.publishDate || '')
    );

    const latestBooks = sortedBooks; 
    const booksByGenre: Record<string, Book[]> = {};

    for (const book of sortedBooks) {
      for (const gName of book.genres) {
        if (!booksByGenre[gName]) {
          booksByGenre[gName] = [];
        }
        booksByGenre[gName].push(book);
      }
    }

    return { latestBooks, booksByGenre };
  } catch (error) {
    console.error("লাইব্রেরি স্ক্যান করতে ব্যর্থ:", error);
    return { latestBooks: [], booksByGenre: {} };
  }
}