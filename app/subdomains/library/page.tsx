import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Layers, Users, ChevronRight } from 'lucide-react';
import { getLibraryBooks } from '../../lib/books';

export default async function LibraryHomePage() {
  const { latestBooks, booksByGenre } = await getLibraryBooks();

  // -------------------------------------------------------------------------
  // লজিক ১: নতুন বই সেকশনের জন্য ১২টি বই সোর্টিং ও ফিল্টারিং
  // -------------------------------------------------------------------------
  const sortedLatestBooks = [...latestBooks]
    .sort((a, b) => {
      if (a.published && b.published) {
        return new Date(b.published).getTime() - new Date(a.published).getTime();
      }
      if (a.published) return -1;
      if (b.published) return 1;
      return (a.title || '').localeCompare(b.title || '', 'bn');
    })
    .slice(0, 12);

  // -------------------------------------------------------------------------
  // লজিক ২: ঘরানা (সর্বোচ্চ ২০টি হোমপেজের জন্য) এবং ইউনিক লেখক তালিকা
  // -------------------------------------------------------------------------
  const allGenres = Object.keys(booksByGenre).filter(Boolean);
  const homeGenres = allGenres.slice(0, 20); // হোমপেজে মাত্র ২০টি জনরা রাখা হলো
  
  const allAuthors = Array.from(
    new Set(latestBooks.map((book) => book.author).filter(Boolean))
  );

  return (
    <div className="max-w-full mx-auto px-4 py-6 space-y-16 font-tarunima">
      
      {/* 🆕 ১. নতুন বই সেকশন */}
      <section aria-labelledby="latest-books-heading">
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-3">
          <h2 
            id="latest-books-heading" 
            className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-emerald-600 pb-3 -mb-3.5"
          >
            <Calendar className="w-5 h-5 text-emerald-600" />
            নতুন বই
          </h2>
          {/* ডানপাশে সকল বইয়ের লিংক */}
          <Link 
            href="/books" 
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group mb-1 font-sans"
          >
            সকল বই 
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        
        {sortedLatestBooks.length === 0 ? (
          <p className="text-sm text-slate-500 py-6">কোনো নতুন বই পাওয়া যায়নি।</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-5">
            {sortedLatestBooks.map((book) => (
              <div 
                key={book.id} 
                className="flex flex-col bg-white rounded border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* 🔗 কভার ইমেজ লিংক */}
                <Link href={`/book/${book.id}`} className="relative aspect-2/3 w-full bg-slate-100 block">
                  <Image
                    src={book.cover || '/images/default-book-cover.png'}
                    alt={book.title}
                    fill
                    sizes="(max-w-768px) 50vw, (max-w-1200px) 25vw, 16vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </Link>
                
                <div className="p-3 flex flex-col grow justify-between">
                  <div>
                    {/* 🔗 বইয়ের টাইটেল লিংক */}
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors">
                      <Link href={`/book/${book.id}`}>
                        {book.title || 'শিরোনামহীন'}
                      </Link>
                    </h3>
                    
                    {/* 🔗 লেখকের নাম লিংক (সরাসরি লেখকের নির্দিষ্ট কালেকশনে যাওয়ার জন্য) */}
                    <p className="text-xs text-slate-600 mt-1 font-tarunima">
                      {book.author ? (
                        <Link 
                          href={`/author/${encodeURIComponent(book.author)}`}
                          className="hover:text-emerald-600 hover:underline transition-colors"
                        >
                          {book.author}
                        </Link>
                      ) : (
                        'অজানা লেখক'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 📚 ২. ঘরানা নির্ঘণ্ট সেকশন */}
      <section aria-labelledby="genre-index-heading">
        <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-3">
          <h2 
            id="genre-index-heading" 
            className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-emerald-600 pb-3 -mb-3.5"
          >
            <Layers className="w-5 h-5 text-emerald-600" />
            ঘরানা
          </h2>
          {/* ডানপাশে সব জনরার লিংক */}
          <Link 
            href="/genres" 
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group mb-1 font-sans"
          >
            ঘরানা নির্ঘণ্ট
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {homeGenres.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">কোনো ঘরানা পাওয়া যায়নি।</p>
        ) : (
          <div className="flex flex-wrap gap-2 w-full">
            {homeGenres.map((genre) => (
              <Link
                key={genre}
                href={`/genre/${encodeURIComponent(genre)}`}
                className="grow text-center min-w-30 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 font-medium p-3 rounded border border-slate-200 hover:border-emerald-300 transition-all text-sm md:text-base shadow-sm"
              >
                {genre}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ✍️ ৩. লেখক নির্ঘণ্ট সেকশন */}
      <section aria-labelledby="author-index-heading">
        <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-3">
          <h2 
            id="author-index-heading" 
            className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-emerald-600 pb-3 -mb-3.5"
          >
            <Users className="w-5 h-5 text-emerald-600" />
            লেখক নির্ঘণ্ট
          </h2>
          {/* ডানপাশে সব লেখকের লিংক */}
          <Link 
            href="/authors" 
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group mb-1 font-sans"
          >
            সব লেখক 
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {allAuthors.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">কোনো লেখক পাওয়া যায়নি।</p>
        ) : (
          <div className="flex flex-wrap gap-2 w-full">
            {allAuthors.map((author) => (
              <Link
                key={author}
                href={`/author/${encodeURIComponent(author)}`}
                className="grow text-center min-w-35 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 font-medium p-3 rounded border border-slate-200 hover:border-emerald-300 transition-all text-sm md:text-base shadow-sm"
              >
                {author}
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}