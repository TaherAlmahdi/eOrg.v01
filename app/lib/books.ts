// d:/SOFTWARE/eOrg.v02/lib/books.ts
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

// ১. আপনার রিকোয়ারমেন্ট এবং ফ্রন্টম্যাটারের সাথে মিলিয়ে ইন্টারফেস সংশোধন করা হলো
export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  genres: string[];
  publishDate?: string;
  published?: string; // ফ্রন্টম্যাটারের সরাসরি ডেট/স্ট্রিং রাখার জন্য
  cover?: string;     // হোমপেজে book.cover ব্যবহারের জন্য
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
          if (data.genre) {
            extractedGenres = Array.isArray(data.genre) ? data.genre : [data.genre];
          }
          
          // ২. ফ্রন্টম্যাটার থেকে আসা variables ম্যাপিং ঠিক করা হলো
          allBooks.push({
            id: `${authorFolderName}-${bookFolderName}`,
            slug: bookFolderName,
            title: data.title || 'শিরোনামহীন বই',
            author: data.author || 'অজ্ঞাত লেখক',
            genres: extractedGenres,
            publishDate: data.published ? String(data.published) : (data.date ? String(data.date) : ''),
            published: data.published ? String(data.published) : '', // সরাসরি published ফিল্ড রিড করবে
            cover: data.cover || data.cover_image || '', // cover অথবা cover_image ব্যাকআপ সহ রিড করবে
          });
        } catch (fileError) {
          continue;
        }
      }
    }

    // ডেট অনুসারে সাজানো (সবচেয়ে নতুন বইগুলো আগে আসবে)
    const sortedBooks = allBooks.sort((a, b) => 
      (b.publishDate || '').localeCompare(a.publishDate || '')
    );

    // ৩. ৮টির সীমাবদ্ধতা তুলে পুরো অ্যারে পাঠানো হলো, যাতে হোমপেজ তার প্রয়োজনমতো ১২টি বা তার বেশি ফিল্টার করতে পারে
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