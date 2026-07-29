import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GenreList from '@/app/components/GenreList';
import AuthorList from '@/app/components/AuthorList';
import { Calendar, ChevronRight } from 'lucide-react';
import { getLibraryBooks } from '../../lib/books';
import { getSlug, getAuthorSlugFromTitle } from '../../lib/content/core/registry';

export default async function LibraryHomePage() {
  const { latestBooks } = await getLibraryBooks();

  const getAuthorSlug = (bookItem: Record<string, unknown>): string => {
    const authorName = String(bookItem.author || '').trim();

    if (authorName) {
      const registrySlug = getAuthorSlugFromTitle(authorName) || getSlug('authors', authorName);
      if (registrySlug && registrySlug !== authorName && registrySlug !== encodeURIComponent(authorName)) {
        return registrySlug;
      }
    }

    if (bookItem.authorSlug) {
      return String(bookItem.authorSlug);
    }

    return authorName
      .toLowerCase()
      .replace(/\s+/g, '-');
  };

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
    .slice(0, 16);

  return (
    <div 
      className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat bg-fixed py-4 px-2 sm:px-4"
      style={{ backgroundImage: "url('/bg01.png')" }}
    >
      <div className="relative w-full h-auto overflow-x-clip mt-2 font-tarunima">
        
        {/* ১. নতুন বই সেকশন */}
        <section aria-labelledby="latest-books-heading">
          <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-3">
            <h2 
              id="latest-books-heading" 
              className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-emerald-600 pb-3 -mb-3.5"
            >
              <Calendar className="w-5 h-5 text-emerald-600" />
              নতুন বই
            </h2>
            <Link 
              href="/books" 
              className="text-sm font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group mb-1"
            >
              সকল বই 
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          
          {sortedLatestBooks.length === 0 ? (
            <p className="text-sm text-slate-500 py-6">কোনো নতুন বই পাওয়া যায়নি।</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-3 p-2">
              {sortedLatestBooks.map((book, index) => {
                const item = book as unknown as Record<string, unknown>;
                const rawBookSlug = item.slug || book.id;
                const bookSlug = String(rawBookSlug);
                const authorSlug = getAuthorSlug(item);

                const responsiveVisibilityClass = 
                  index >= 12 
                    ? "block sm:hidden xl:block"           
                    : index >= 8 
                      ? "block sm:hidden md:block"         
                      : "block";                          

                return (
                  <div 
                    key={bookSlug} 
                    className={`flex flex-col bg-white rounded border border-slate-200 shadow-sm transition-all hover:shadow-md group ${responsiveVisibilityClass}`}
                  >
                    <Link href={`/book/${encodeURIComponent(bookSlug)}`} className="relative aspect-2/3 w-full bg-slate-100 block overflow-hidden rounded-t">
                      <Image
                        src={book.cover || '/images/default-book-cover.png'}
                        alt={book.title || 'বইয়ের প্রচ্ছদ'}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </Link>
                    
                    <div className="p-3 flex flex-col grow justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors">
                          <Link href={`/book/${encodeURIComponent(bookSlug)}`}>
                            {book.title || 'শিরোনামহীন'}
                          </Link>
                        </h3>
                        
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

        {/* ২. ঘরানা নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-up" className="relative">
          <GenreList />
        </section>

        {/* ৩. লেখক নির্ঘণ্ট সেকশন */}
        <section data-aos="fade-down" className="relative">
          <AuthorList />
        </section>

      </div>
    </div>
  );
}