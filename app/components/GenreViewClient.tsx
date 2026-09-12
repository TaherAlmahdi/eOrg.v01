// app/components/GenreViewClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, BookOpen } from 'lucide-react';

const toBengaliNumber = (num: number | string) => {
  const englishToBengali: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().replace(/\d/g, (digit) => englishToBengali[digit] || digit);
};

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

export interface BookItem {
  id?: string;
  slug?: string;
  title?: string;
  author?: string;
  cover?: string;
  [key: string]: unknown;
}

interface GenreViewClientProps {
  initialBooks: BookItem[];
  targetBengaliGenre: string;
}

export default function GenreViewClient({ initialBooks, targetBengaliGenre }: GenreViewClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // সার্চ কুয়েরি অনুযায়ী বই ফিল্টারিং
  const displayedBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initialBooks;

    return initialBooks.filter((book) => {
      const titleMatch = (book.title || '').toLowerCase().includes(q);
      const authorMatch = (book.author || '').toLowerCase().includes(q);
      return titleMatch || authorMatch;
    });
  }, [initialBooks, searchQuery]);

  return (
    <div>
      {/* হেডার: বামে টাইটেল ও কাউন্ট, ডানে লাইভ সার্চবার */}
      <header className="mb-6 border-b border-orange-200 pb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold font-sabrina text-gray-800">
            ঘরানা : {targetBengaliGenre}
          </h2>
          <p className="text-gray-500 mt-1 italic text-sm md:text-base">
            {displayedBooks.length > 0
              ? `এই ঘরানায় মোট ${toBengaliNumber(displayedBooks.length)}টি বই রয়েছে`
              : "কোনো বই পাওয়া যায়নি"}
          </p>
        </div>

        <div className="w-full md:w-80 relative">
          <div className="relative flex items-center w-full">
            <Search size={18} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বই বা লেখকের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-800 placeholder-gray-400 shadow-xs"
            />
          </div>
        </div>
      </header>

      {/* বইয়ের গ্রিড ডিসপ্লে */}
      {displayedBooks.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 gap-2 pb-4 border-b border-red-100">
          {displayedBooks.map((book) => (
            <Link
              key={book.id || book.slug}
              href={`/book/${book.id || book.slug}`}
              className="group flex flex-col h-full"
            >
              <div className="relative aspect-2/3 overflow-hidden rounded shadow-sm bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md">
                <Image
                  src={getCoverImageUrl(book.cover)}
                  alt={book.title || 'বইয়ের প্রচ্ছদ'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="mt-2 text-center">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                  {book.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1 font-tarunima">
                  {book.author || 'অজানা লেখক'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed border-orange-100 rounded-2xl">
          <BookOpen size={48} className="mx-auto text-orange-200 mb-4" />
          <p className="text-gray-400 text-lg italic">
            {searchQuery
              ? `"${searchQuery}" এর সাথে মিলে এমন কোনো বই খুঁজে পাওয়া যায়নি।`
              : "দুঃখিত, এই বিভাগে কোনো বই খুঁজে পাওয়া যায়নি।"}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-orange-600 hover:underline cursor-pointer"
            >
              সার্চ রিসেট করুন
            </button>
          ) : (
            <Link href="/books" className="mt-6 inline-block text-emerald-600 hover:underline font-medium">
              সকল বই দেখুন
            </Link>
          )}
        </div>
      )}
    </div>
  );
}