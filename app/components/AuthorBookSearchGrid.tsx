'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Book, X } from 'lucide-react';

interface BookItem {
  id?: string;
  title: string;
  slug?: string;
  coverImage?: string;
  cover?: string;
}

export default function AuthorBookSearchGrid({ books = [] }: { books?: BookItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('সব');

  // 🔹 ১. বইয়ের নাম থেকে ডাইনামিকভাবে (Dynamically) আদ্যক্ষরের তালিকা তৈরি
  const dynamicLetters = useMemo(() => {
    const safeBooks = Array.isArray(books) ? books : [];
    const lettersSet = new Set<string>();

    safeBooks.forEach((book) => {
      if (book && book.title) {
        // প্রথম দৃশ্যমান অক্ষর বের করা
        const firstChar = book.title.trim().charAt(0).toUpperCase();
        if (firstChar) {
          lettersSet.add(firstChar);
        }
      }
    });

    // অক্ষরের অ্যারেকে বর্ণানুক্রমিকভাবে (Alphabetically) সাজানো
    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, 'bn')
    );

    return ['সব', ...sortedLetters];
  }, [books]);

  // 🔹 ২. নির্বাচিত আদ্যক্ষর ও সার্চ ইনপুট অনুযায়ী বই ফিল্টার
  const filteredBooks = useMemo(() => {
    const safeBooks = Array.isArray(books) ? books : [];

    return safeBooks.filter((book) => {
      if (!book || !book.title) return false;

      const title = book.title.trim();
      const firstChar = title.charAt(0).toUpperCase();

      // আদ্যক্ষর ফিল্টার
      const matchesLetter =
        selectedLetter === 'সব' || firstChar === selectedLetter;

      // সার্চ ইনপুট ফিল্টার
      const matchesSearch = title
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());

      return matchesLetter && matchesSearch;
    });
  }, [books, selectedLetter, searchQuery]);

  return (
    <div className="space-y-5 w-full">
      {/* 🔹 ১. সার্চ ইনপুট (মোবাইলে ফুল উইডথ, বড় স্ক্রিনে সেন্টারে) */}
      <div className="relative w-full md:w-96 md:mx-auto">
        <input
          type="text"
          placeholder="বইয়ের নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]/30 focus:border-[#008080] transition-all shadow-xs"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 🔹 ২. ডাইনামিক আদ্যক্ষর ফিল্টার বার (শুধুমাত্র যেসব অক্ষরের বই আছে সেগুলোই দেখাবে) */}
      {dynamicLetters.length > 1 && (
        <div className="w-full bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-teal-100/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {dynamicLetters.map((letter) => {
              const isActive = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-3 py-1 text-xs md:text-sm font-semibold rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-[#008080] text-white shadow-xs scale-105'
                      : 'bg-teal-50/60 text-teal-900 hover:bg-teal-100/80 border border-teal-100'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 🔹 ৩. ফিল্টার করা গ্রিড (বই না পাওয়া গেলে মেসেজ) */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">
            {searchQuery.trim() !== ''
              ? `${searchQuery} নামে কোন বই পাওয়া যায়নি।`
              : selectedLetter !== 'সব'
              ? `${selectedLetter} অক্ষর দিয়ে কোন বই পাওয়া যায়নি।`
              : 'কোন বই পাওয়া যায়নি।'}
          </p>
          {(selectedLetter !== 'সব' || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setSelectedLetter('সব');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#008080] font-semibold hover:underline"
            >
              সব বই দেখুন
            </button>
          )}
        </div>
      ) : (
        /* 🔹 ৪. বইয়ের রেসপন্সিভ গ্রিড */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 w-full">
          {filteredBooks.map((book) => {
            const bookSlug =
              book.slug || encodeURIComponent(book.title.toLowerCase());
            const coverSrc = book.coverImage || book.cover;

            return (
              <Link
                key={book.id || bookSlug}
                href={`/book/${bookSlug}`}
                className="group flex flex-col bg-white rounded border border-teal-100/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-300 overflow-hidden"
              >
                {/* কভার ইমেজ */}
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

                {/* বইয়ের নাম */}
                <div className="p-2.5 flex-1 flex items-start justify-center text-center font-tarunima">
                  <h3 className="text-xs md:text-sm font-medium text-gray-800 group-hover:text-[#008080] transition-colors leading-snug line-clamp-2">
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