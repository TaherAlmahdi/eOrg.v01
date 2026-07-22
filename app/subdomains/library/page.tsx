import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Layers, Users, ChevronRight } from 'lucide-react';
import { getLibraryBooks } from '../../lib/books';
// 🔹 রেজিস্ট্রি ফাইল থেকে সার্বজনীন getSlug এবং টাইটেল হেলপার ইমপোর্ট
import { getGenreTitle, getSlug, getAuthorSlugFromTitle } from '../../lib/content/core/registry';

export default async function LibraryHomePage() {
  const { latestBooks, booksByGenre } = await getLibraryBooks();

  // -------------------------------------------------------------------------
  // হেলপার লজিক: বাংলা থেকে ইংরেজি স্লাগে রূপান্তর (Registry First + Fallback)
  // -------------------------------------------------------------------------
  
  // ১. ঘরানা স্লাগ বের করা (রেজিস্ট্রি getSlug -> Fallback)
  const getGenreSlugFromTitle = (genreInput: string): string => {
    const trimmed = genreInput.trim();
    if (!trimmed) return 'others';

    // ১. প্রথমে রেজিস্ট্রি থেকে ইংরেজি স্লাগ খোঁজা
    const registrySlug = getSlug('genres', trimmed);
    if (registrySlug && registrySlug !== encodeURIComponent(trimmed)) {
      return registrySlug;
    }

    // ২. booksByGenre-এর Key যদি ইতিমধ্যে ইংরেজি স্লাগ হয়
    const foundSlug = Object.keys(booksByGenre).find((slug) => {
      const title = getGenreTitle(slug);
      return title && title.trim().toLowerCase() === trimmed.toLowerCase();
    });

    return foundSlug || registrySlug || trimmed;
  };

  // ২. লেখক স্লাগ বের করা (রেজিস্ট্রি -> MD authorSlug -> Slugify Fallback)
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
  // লজিক ১: নতুন বই সেকশনের জন্য ১২টি বই সোর্টিং ও ফিল্টারিং
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

  // -------------------------------------------------------------------------
  // লজিক ২: ঘরানা এবং ইউনিক লেখক তালিকা (ইংরেজি স্লাগ সহ)
  // -------------------------------------------------------------------------
  // MD ফাইলের বাংলা জনরা থেকে রেজিস্ট্রি চেক করে ইংরেজি স্লাগে ম্যাপিং (সর্বোচ্চ ২০টি)
  const rawGenreKeys = Object.keys(booksByGenre).filter(Boolean);
  const homeGenres = rawGenreKeys.slice(0, 20).map((key) => {
    // key থেকে রেজিস্ট্রি ব্যবহার করে ইংরেজি স্লাগ বের করা
    const slug = getGenreSlugFromTitle(key);
    // স্লাগ দিয়ে বাংলা টাইটেল আনা (যদি key নিজেই স্লাগ হয়ে থাকে)
    const title = getGenreTitle(slug) || key;
    return { slug, title };
  });

  // MD ফাইলের বাংলা author থেকে রেজিস্ট্রি ও ইংরেজি authorSlug ম্যাপ তৈরি
  const authorMap = new Map<string, string>(); // <authorSlug, authorName>
  latestBooks.forEach((book) => {
    if (book.author) {
      const item = book as unknown as Record<string, unknown>;
      const slug = getAuthorSlug(item);
      if (slug && !authorMap.has(slug)) {
        authorMap.set(slug, book.author);
      }
    }
  });
  const allAuthors = Array.from(authorMap.entries()); // [ [authorSlug, authorName], ... ]

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
                      
                      {/* 🔗 লেখকের নাম লিংক (ইংরেজি authorSlug দিয়ে) */}
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
            {homeGenres.map(({ slug, title }) => (
              <Link
                key={slug}
                href={`/genre/${encodeURIComponent(slug)}`}
                className="grow text-center min-w-30 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 font-medium p-3 rounded border border-slate-200 hover:border-emerald-300 transition-all text-sm md:text-base shadow-sm"
              >
                {title}
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
            {allAuthors.map(([authorSlug, authorName]) => (
              <Link
                key={authorSlug}
                href={`/author/${encodeURIComponent(authorSlug)}`}
                className="grow text-center min-w-35 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 font-medium p-3 rounded border border-slate-200 hover:border-emerald-300 transition-all text-sm md:text-base shadow-sm"
              >
                {authorName}
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}