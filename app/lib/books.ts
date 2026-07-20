// d:/SOFTWARE/eOrg.v02/lib/books.ts
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  genres: string[];
  publishDate?: string;
  coverImage?: string;
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
          
          allBooks.push({
            id: `${authorFolderName}-${bookFolderName}`,
            slug: bookFolderName,
            title: data.title || 'শিরোনামহীন বই',
            author: data.author || 'অজ্ঞাত লেখক',
            genres: extractedGenres,
            publishDate: data.date ? String(data.date) : '',
            coverImage: data.cover_image || '',
          });
        } catch (fileError) {
          continue;
        }
      }
    }

    const sortedBooks = allBooks.sort((a, b) => 
      (b.publishDate || '').localeCompare(a.publishDate || '')
    );

    const latestBooks = sortedBooks.slice(0, 8);
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