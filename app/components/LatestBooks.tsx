import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronRight } from 'lucide-react';
import { getSlug, getAuthorSlugFromTitle } from '@/app/lib/content/core/registry'; // আপনার প্রজেক্টের পাথ অনুযায়ী অ্যাডজাস্ট করে নিন

interface BookItem {
  id?: string;
  slug?: string;
  title?: string;
  author?: string;
  authorSlug?: string;
  cover?: string;
  published?: string | number;
  [key: string]: unknown;
}

interface LatestBooksProps {
  books?: BookItem[];
  limit?: number;
}

// 🔹 Cloudflare R2 Media Base URL ফরম্যাটিং হেল্পার
const getCoverImageUrl = (coverPath?: string | null): string => {
  if (!coverPath) return '/cover/default-cover.webp';

  let rawPath = coverPath.trim().replace(/\\/g, '/');

  // 'public/' বা '/public/' রিমুভ করা
  if (rawPath.startsWith('public/')) {
    rawPath = rawPath.replace('public/', '');
  } else if (rawPath.startsWith('/public/')) {
    rawPath = rawPath.replace('/public/', '');
  }

  // শুরুর স্ল্যাশ বাদ দেওয়া
  const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

  // ফুল URL থাকলে সেটাই রিটার্ন করবে, অন্যথায় Cloudflare R2 URL যুক্ত করবে
  return cleanPath.startsWith('http://') || cleanPath.startsWith('https://')
    ? cleanPath
    : `https://media.eduliture.org/${cleanPath}`;
};

// লেখক স্লাগ বের করার হেল্পার ফাংশন
const getAuthorSlug = (bookItem: BookItem): string => {
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

  return authorName.toLowerCase().replace(/\s+/g, '-');
};

export default function LatestBooks({ books = [], limit = 16 }: LatestBooksProps) {
  // বইগুলোকে প্রকাশের তারিখ অনুযায়ী লেটেস্ট সর্ট করে নেওয়া
  const sortedLatestBooks = [...books]
    .sort((a, b) => {
      const pubA = a.published;
      const pubB = b.published;

      const timeA = pubA ? new Date(Date.parse(String(pubA))).getTime() : 0;
      const timeB = pubB ? new Date(Date.parse(String(pubB))).getTime() : 0;

      const validA = !isNaN(timeA) && timeA > 0;
      const validB = !isNaN(timeB) && timeB > 0;

      if (validA && validB) return timeB - timeA;
      if (validA) return -1;
      if (validB) return 1;

      return (a.title || '').localeCompare(b.title || '', 'bn');
    })
    .slice(0, limit);

  return (
    <section aria-labelledby="latest-books-heading">
      <div className="flex w-full items-center justify-between mt-4 px-3 sm:px-4 py-2 mb-4 rounded bg-teal-50/90 text-[#008080] border border-teal-100 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Calendar size={22} className="shrink-0 animate-pulse text-emerald-600 sm:w-6 sm:h-6" />
          <h2 id="latest-books-heading" className="text-base sm:text-lg md:text-xl font-black text-slate-800 font-tarunima truncate">
            <span className="text-[#008080]">নতুন</span> <span className="text-[#cc7a00]">বই</span>
          </h2>
        </div>
        <Link
          href="/books"
          className="text-xs sm:text-sm md:text-base font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group shrink-0"
        >
          সব বই
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {sortedLatestBooks.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">কোনো নতুন বই পাওয়া যায়নি।</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 md:gap-2 lg:gap-2 p-0 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 bg-gray-200/50">
          {sortedLatestBooks.map((book, index) => {
            const rawBookSlug = book.slug || book.id;
            const bookSlug = String(rawBookSlug);
            const authorSlug = getAuthorSlug(book);

            const responsiveVisibilityClass = index >= 8 ? "hidden sm:flex" : "flex";

            return (
              <div
                key={bookSlug}
                className={`flex-col bg-white rounded border border-slate-200 shadow-sm transition-all hover:shadow-md group ${responsiveVisibilityClass}`}
              >
                <Link href={`/book/${encodeURIComponent(bookSlug)}`} className="relative block w-full overflow-hidden rounded-t aspect-2/3 bg-slate-100">
                  <Image
                    src={getCoverImageUrl(book.cover)}
                    alt={book.title || 'বইয়ের প্রচ্ছদ'}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </Link>

                <div className="flex flex-col justify-between p-3 grow">
                  <div className="text-center">
                    <h3 className="text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700 line-clamp-2">
                      <Link href={`/book/${encodeURIComponent(bookSlug)}`}>
                        {book.title || 'শিরোনামহীন'}
                      </Link>
                    </h3>

                    <p className="mt-1 text-xs md:text-sm text-gray-500 font-tarunima">
                      {book.author ? (
                        <Link
                          href={`/author/${encodeURIComponent(authorSlug)}`}
                          className="transition-colors hover:text-emerald-600 hover:underline"
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
  );
}