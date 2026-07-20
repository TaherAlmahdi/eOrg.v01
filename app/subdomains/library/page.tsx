// d:/SOFTWARE/eOrg.v02/app/subdomains/library/page.tsx
import React from 'react';
import { Calendar, BookOpen } from 'lucide-react';
import { getLibraryBooks } from '../../lib/books';
import { BookCard } from '@/app/components/BookCard';


export default async function LibraryHomePage() {
  const { latestBooks, booksByGenre } = await getLibraryBooks();

  return (
    <div className="max-w-full mx-auto px-2 py-2 space-y-16 font-tarunima">
      
      {/* 🆕 ১. সর্বশেষ সংযোজিত বই সেকশন */}
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
          <p className="text-sm text-slate-500 py-6">কোনো বই পাওয়া যায়নি।</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
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
              <BookCard key={`${genreName}-${book.id}`} book={book} />
            ))}
          </div>
        </section>
      ))}

    </div>
  );
}