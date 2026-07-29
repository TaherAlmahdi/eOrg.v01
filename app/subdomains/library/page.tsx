import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GenreList from '@/app/components/GenreList';
import AuthorList from '@/app/components/AuthorList';
import { Calendar, ChevronRight } from 'lucide-react';
import { getLibraryBooks } from '../../lib/books';
// 🔹 রেজিস্ট্রি ফাইল থেকে টাইটেল ও স্লাগ হেলপার ইমপোর্ট
import { getSlug, getAuthorSlugFromTitle } from '../../lib/content/core/registry';

export default async function LibraryHomePage() {
  const { latestBooks } = await getLibraryBooks();

  // -------------------------------------------------------------------------
  // হেলপার লজিক: লেখক স্লাগ বের করা (Registry -> MD authorSlug -> Slugify Fallback)
  // -------------------------------------------------------------------------
  const getAuthorSlug = (bookItem: Record<string, unknown>): string => {
    const authorName = String(bookItem.author || '').trim();

    // ১. প্রথমে রেজিস্ট্রি থেকে ইংরেজি স্লাগ বের করা
    if (authorName) {
      const registrySlug = getAuthorSlugFromTitle(authorName) || getSlug('authors', authorName);
      if (registrySlug && registrySlug !== authorName && registrySlug !== encodeURIComponent(authorName)) {
        return registrySlug;
      }
    }

    // ২. রেজিস্ট্রি না পেলে MD ফাইলের সরাসরি দেওয়া authorSlug চেক করা
    if (bookItem.authorSlug) {
      return String(bookItem.authorSlug);
    }

    // ৩. সর্বশেষে সাধারণ slugify লজিক (Fallback)
    return authorName
      .toLowerCase()
      .replace(/\s+/g, '-');
  };

  // -------------------------------------------------------------------------
  // লজিক: নতুন বই সেকশনের জন্য ১২টি বই সোর্টিং ও ফিল্টারিং
  // -------------------------------------------------------------------------
  const sortedLatestBooks = [...latestBooks]
    .sort((a, b) => {
      const pubA = a.published || (a as unknown as Record<string, unknown>).first_published;
      const pubB = b.published || (b as unknown as Record<string, unknown>).first_published;

      if (pubA && pubB) {
        return new Date(String(pubB)).getTime() - new Date(String(pubA)).getTime();
      }
      if (pubA) return -1;
      if (pubB) return 1;
      return (a.title || '').localeCompare(b.title || '', 'bn');
    })
    .slice(0, 12);

  return (
    <div 
      className="relative w-full h-auto bg-cover bg-center bg-no-repeat bg-fixed py-2 px-2 md:px-2 overflow-x-clip"
      style={{ backgroundImage: "url('/bg01.png')" }}
    >
      <div className="px-2 py-3 space-y-16 font-tarunima">
        
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
              className="text-sm font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group mb-1 font-sans"
            >
              সকল বই 
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          
          {sortedLatestBooks.length === 0 ? (
            <p className="text-sm text-slate-500 py-6">কোনো নতুন বই পাওয়া যায়নি।</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-3">
              {sortedLatestBooks.map((book) => {
                const item = book as unknown as Record<string, unknown>;
                const rawBookSlug = item.slug || book.id;
                const bookSlug = String(rawBookSlug);
                
                const authorSlug = getAuthorSlug(item);

                return (
                  <div 
                    key={bookSlug} 
                    className="flex flex-col bg-white rounded border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    {/* 🔗 কভার ইমেজ লিংক */}
                    <Link href={`/book/${encodeURIComponent(bookSlug)}`} className="relative aspect-2/3 w-full bg-slate-100 block">
                      <Image
                        src={book.cover || '/images/default-book-cover.png'}
                        alt={book.title || 'বইয়ের প্রচ্ছদ'}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </Link>
                    
                    <div className="p-3 flex flex-col grow justify-between">
                      <div>
                        {/* 🔗 বইয়ের টাইটেল লিংক */}
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors">
                          <Link href={`/book/${encodeURIComponent(bookSlug)}`}>
                            {book.title || 'শিরোনামহীন'}
                          </Link>
                        </h3>
                        
                        {/* 🔗 লেখকের নাম লিংক */}
                        <p className="text-xs text-slate-600 mt-1 font-tarunima">
                          {book.author ? (
                            <Link 
                              href={`/author/${encodeURIComponent(authorSlug)}`}
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
                );
              })}
            </div>
          )}
        </section>

        {/* 📚 ২. ঘরানা নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-down" className="relative pb-2">
          <div className="max-w-full mx-auto">
            <GenreList />
          </div>
        </section>

        {/* ✍️ ৩. লেখক নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-down" className="relative px-2">
          <div className="max-w-full mx-auto">
            <AuthorList />
          </div>
        </section>

      </div>
    </div>
  );
}