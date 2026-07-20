import React from 'react';
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { BookOpen, Calendar, User } from 'lucide-react';

// ১. বুক ডাটা স্ট্রাকচার টাইপ ডেফিনিশন
interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  genre: string;
  publishDate?: string;
  coverImage?: string;
}

// ২. সিকোয়েনশিয়াল ফর-লুপ দিয়ে ডাটা ফেচিং ফাংশন (১০০% ক্যাশ ও সিঙ্ক প্রুফ)
async function getLibraryBooks(): Promise<{ latestBooks: Book[]; booksByGenre: Record<string, Book[]> }> {
  const booksDirectory = path.join(process.cwd(), 'content', 'books');
  let allBooks: Book[] = [];

  try {
    // ক) প্রথম লেভেল: সব লেখক (Author) ফোল্ডার রিড করা
    const authorItems = await fs.readdir(booksDirectory, { withFileTypes: true });
    
    for (const authorItem of authorItems) {
      if (authorItem.isDirectory()) {
        const authorFolderName = authorItem.name;
        const authorFolderPath = path.join(booksDirectory, authorFolderName);
        
        // খ) দ্বিতীয় লেভেল: লেখকের ভেতরের সব বইয়ের (Book) ফোল্ডার রিড করা
        const bookItems = await fs.readdir(authorFolderPath, { withFileTypes: true });

        for (const bookItem of bookItems) {
          if (bookItem.isDirectory()) {
            const bookFolderName = bookItem.name; // এটিই বইয়ের আসল slug (যেমন: anandamoth)
            const indexMdPath = path.join(authorFolderPath, bookFolderName, 'index.md');

            try {
              // ফাইলটি এক্সিস্ট করে কিনা এবং রিড করা যাচ্ছে কিনা নিশ্চিত করা
              const fileContents = await fs.readFile(indexMdPath, 'utf8');
              
              // gray-matter দিয়ে ফ্রন্টমেটার (Metadata) পার্স করা
              const { data } = matter(fileContents);
              
              allBooks.push({
                id: `${authorFolderName}-${bookFolderName}`,
                slug: bookFolderName,
                title: data.title || 'শিরোনামহীন বই',
                author: data.author || 'অজ্ঞাত লেখক',
                genre: data.genre || 'অন্যান্য',
                publishDate: data.date ? String(data.date) : '',
                coverImage: data.coverImage || '',
              });
            } catch (fileError) {
              // যদি কোনো ফোল্ডারে index.md না থাকে বা রিড পারমিশন না থাকে
              console.warn(`ফাইল রিড করা যায়নি: ${indexMdPath}`);
              continue;
            }
          }
        }
      }
    }

    // তারিখ অনুযায়ী সাজানো (নতুন আপলোড হওয়া বই আগে আসবে)
    const sortedBooks = allBooks.sort((a, b) => {
      return (b.publishDate || '').localeCompare(a.publishDate || '');
    });

    // 'সংযোজন' সেকশনের জন্য প্রথম ৮টি বই
    const latestBooks = sortedBooks.slice(0, 8);

    // ঘরানা ভিত্তিক গ্রুপিং
    const booksByGenre = sortedBooks.reduce((acc, book) => {
      const currentGenre = book.genre;
      if (!acc[currentGenre]) {
        acc[currentGenre] = [];
      }
      acc[currentGenre].push(book);
      return acc;
    }, {} as Record<string, Book[]>);

    return { latestBooks, booksByGenre };
  } catch (error) {
    console.error("লাইব্রেরি ডিরেক্টরি স্ক্যান করতে ব্যর্থ:", error);
    return { latestBooks: [], booksByGenre: {} };
  }
}

// ৩. মূল পেজ সার্ভার কম্পোনেন্ট
export default async function LibraryHomePage() {
  const { latestBooks, booksByGenre } = await getLibraryBooks();

  return (
    <div className="max-w-full mx-auto px-4 py-10 space-y-16 font-tarunima">
      
      {/* 🆕 ১. সর্বশেষ সংযোজিত বই সেকশন (সংযোজন) */}
      <section aria-labelledby="latest-books-heading">
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-3">
          <h2 
            id="latest-books-heading" 
            className="text-2xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-emerald-600 pb-3 -mb-[14px]"
          >
            <Calendar className="w-5 h-5 text-emerald-600" />
            সংযোজন
          </h2>
        </div>
        
        {latestBooks.length === 0 ? (
          <p className="text-sm text-slate-500 py-6">কোনো বই পাওয়া যায়নি।</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5">
            {latestBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* 📚 ২. ডাইনামিক ঘরানা ভিত্তিক সেকশনসমূহ */}
      {Object.entries(booksByGenre).map(([genreName, books]) => (
        <section key={genreName} aria-label={genreName}>
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-emerald-600 pb-3 -mb-[14px]">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              {genreName}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      ))}

    </div>
  );
}

// 🎴 ৪. রিইউজেবল বুক কার্ড সাব-কম্পোনেন্ট
function BookCard({ book }: { book: Book }) {
  return (
    <Link 
      href={`/book/${book.slug}`}
      className="group flex flex-col h-full border border-slate-100 rounded-xl bg-white p-3.5 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 relative top-0 hover:-top-1"
    >
      <div className="aspect-[3/4] w-full bg-gradient-to-tr from-slate-100 to-slate-50 rounded-lg mb-3 flex flex-col items-center justify-center text-xs text-slate-400 font-medium relative overflow-hidden border border-slate-200/60 shadow-inner group-hover:from-emerald-50 group-hover:to-white transition-colors">
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={book.coverImage} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <>
            <BookOpen className="w-8 h-8 mb-2 text-slate-300 group-hover:text-emerald-200 transition-colors" />
            <span className="tracking-wide text-[11px]">প্রচ্ছদ</span>
          </>
        )}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/5 to-transparent"></div>
      </div>
      
      <div className="flex flex-col flex-grow justify-between pt-1">
        <div>
          <h3 className="font-bold text-sm md:text-base text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors pb-1" title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate" title={book.author}>
            <User className="w-3 h-3 flex-shrink-0 text-slate-400" />
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
}