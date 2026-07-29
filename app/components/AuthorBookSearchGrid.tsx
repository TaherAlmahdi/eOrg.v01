'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Book } from 'lucide-react';
import { getBookBySlug, BookDetail } from '@/app/lib/books';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';

interface BookItem {
  id?: string;
  title: string;
  slug?: string;
  coverImage?: string;
  cover?: string;
}

export default function AuthorBookSearchGrid({ books }: { books: BookItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  // 🔹 সার্চ ফিল্টারিং (বইয়ের নাম অনুযায়ী)
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* সার্চ বক্স */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="বইয়ের নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]/30 focus:border-[#008080] transition-all shadow-xs"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* বই না পাওয়া গেলে */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">
            "{searchQuery}" নামে কোনো বই পাওয়া যায়নি।
          </p>
        </div>
      ) : (
        /* 🔹 নির্দিষ্ট প্রয়োজনীয়তা অনুযায়ী রেসপন্সিভ গ্রিড:
           - মোবাইল: ২ কলাম (grid-cols-2)
           - ট্যাব: ৪ কলাম (md:grid-cols-4)
           - ল্যাপটপ: ৬ কলাম (lg:grid-cols-6)
           - ডেস্কটপ: ৮ কলাম (xl:grid-cols-8)
        */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {filteredBooks.map((book) => {
            // getSlug এর বদলে সরাসরি slug বা safe fallback ব্যবহার করা হলো
            const bookSlug = book.slug || encodeURIComponent(book.title.toLowerCase());
            const coverSrc = book.coverImage || book.cover;

            return (
              <Link
                key={book.id || bookSlug}
                href={`/book/${bookSlug}`}
                className="group flex flex-col bg-white rounded-lg border border-teal-100/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-300 overflow-hidden"
              >
                {/* 🔹 কভার ইমেজ সেকশন (2/3 Aspect Ratio) */}
                <div className="relative w-full aspect-[2/3] bg-amber-50/50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                  {coverSrc ? (
                    <Image
                      src={coverSrc}
                      alt={book.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.6vw, 12.5vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-teal-800/40">
                      <Book className="w-8 h-8 mb-1 stroke-1" />
                      <span className="text-[10px] font-medium leading-tight line-clamp-2 px-1">
                        {book.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* 🔹 বইয়ের নাম (কভারের নিচে) */}
                <div className="p-2.5 flex-1 flex items-start justify-center text-center">
                  <h3 className="text-xs md:text-sm font-bold text-gray-800 group-hover:text-[#008080] transition-colors leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}