'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Home, Search, BookOpen } from "lucide-react";
import { buildTabTitle } from '@/app/lib/get-site-data';

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string) => {
  const englishToBengali: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().replace(/\d/g, (digit) => englishToBengali[digit] || digit);
};

// বাংলা ক্যারেক্টার নরমালাইজেশন
const normalizeBengali = (text: string = ''): string => {
  return text
    .normalize('NFC')
    .replace(/\u09af\u09bc/g, 'য়')
    .replace(/\u09a1\u09bc/g, 'ড়')
    .replace(/\u09a2\u09bc/g, 'ঢ়')
    .replace(/\u09b0\u09bc/g, 'র')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .trim();
};

export interface Book {
  id?: string;
  slug: string;
  title: string;
  author?: string;
  cover_image?: string;
  cover?: string;
  genres?: string[];
  genre?: string | string[];
  [key: string]: unknown;
}

interface BooksPageClientProps {
  initialBooks: Book[];
  siteTitle: string;
  genreTitle?: string;
}

export default function BooksPageClient({ 
  initialBooks = [], 
  siteTitle, 
  genreTitle 
}: BooksPageClientProps) {
  
  // সার্ভার ও ক্লায়েন্ট উভয় ক্ষেত্রে প্রথম রেন্ডারে নিরাপদ ডিফল্ট মান ৩০ রাখা হলো (Hydration Mismatch এড়াতে)
  const [limit, setLimit] = useState(30);

  // ব্রাউজারে মাউন্ট হওয়ার পর সঠিক স্ক্রিন সাইজ অনুযায়ী লিমিট আপডেট হবে
  useEffect(() => {
    if (window.innerWidth >= 1280) {
      setLimit(40);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('সব');
  const [visibleCount, setVisibleCount] = useState(limit);

  // লিমিট পরিবর্তন হলে দৃশ্যমান কাউন্ট আপডেট করা
  useEffect(() => {
    setVisibleCount(limit);
  }, [limit]);

  // ১. প্রাথমিক বইগুলো সর্ট করা
  const sortedBooks = useMemo(() => {
    const safeBooks = Array.isArray(initialBooks) ? initialBooks : [];
    return [...safeBooks].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'bn')
    );
  }, [initialBooks]);

  // ২. ডায়নামিক বর্ণ তালিকা তৈরি
  const availableAlphabets = useMemo(() => {
    const lettersSet = new Set<string>();
    sortedBooks.forEach((book) => {
      let firstChar = (book.title || '').trim().charAt(0);
      if (firstChar) {
        if (/[a-zA-Z]/.test(firstChar)) {
          firstChar = firstChar.toUpperCase();
        }
        lettersSet.add(firstChar);
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, 'bn')
    );
    return ['সব', ...sortedLetters];
  }, [sortedBooks]);

  // ৩. সার্চ ও লেটার অনুযায়ী রিয়েল-টাইম ফিল্টারিং লজিক
  const filteredBooks = useMemo(() => {
    const normalizedQuery = normalizeBengali(searchQuery);
    const compactQuery = normalizedQuery.replace(/\s+/g, '');
    const normalizedSelectedLetter = normalizeBengali(selectedLetter);
    const normalizedGenre = normalizeBengali(genreTitle || '');

    return sortedBooks.filter((book) => {
      // ঘরানা (Genre) ফিল্টার
      if (normalizedGenre) {
        const bookGenres = Array.isArray(book.genres)
          ? book.genres
          : typeof book.genre === 'string'
          ? [book.genre]
          : Array.isArray(book.genre)
          ? book.genre
          : [];
        const matchesGenre = bookGenres.some((g) =>
          normalizeBengali(g).includes(normalizedGenre)
        );
        if (!matchesGenre) return false;
      }

      // সার্চ কুয়েরি ফিল্টার (টাইটেল বা লেখক)
      const normalizedTitle = normalizeBengali(book.title || '');
      const normalizedAuthor = normalizeBengali(book.author || '');
      const compactTitle = normalizedTitle.replace(/\s+/g, '');
      const compactAuthor = normalizedAuthor.replace(/\s+/g, '');

      const titleMatches = normalizedTitle.includes(normalizedQuery) || compactTitle.includes(compactQuery);
      const authorMatches = normalizedAuthor.includes(normalizedQuery) || compactAuthor.includes(compactQuery);
      const matchesSearch = !compactQuery || titleMatches || authorMatches;

      // আদ্যক্ষর (Letter) ফিল্টার
      let rawFirstChar = (book.title || '').trim().charAt(0);
      if (/[a-zA-Z]/.test(rawFirstChar)) {
        rawFirstChar = rawFirstChar.toUpperCase();
      }
      const titleFirstChar = normalizeBengali(rawFirstChar);
      const matchesLetter = selectedLetter === 'সব' || titleFirstChar === normalizedSelectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [sortedBooks, searchQuery, selectedLetter, genreTitle]);

  // সার্চ বা লেটার পরিবর্তন করলে দৃশ্যমান কাউন্ট রিসেট করা
  useEffect(() => {
    setVisibleCount(limit);
  }, [searchQuery, selectedLetter, limit]);

  // বর্তমান দৃশ্যমান বইগুলো
  const currentBooks = useMemo(() => {
    return filteredBooks.slice(0, visibleCount);
  }, [filteredBooks, visibleCount]);

  const hasMore = visibleCount < filteredBooks.length;

  // ৪. ডায়নামিক ব্রাউজার ট্যাবটাইটেল আপডেট
  useEffect(() => {
    const baseTitle = genreTitle || 'গ্রন্থাগার';
    let currentPageTitle = baseTitle;

    if (searchQuery.trim()) {
      currentPageTitle = `${baseTitle} (খুঁজছেন: ${searchQuery.trim()})`;
    } else if (selectedLetter !== 'সব') {
      currentPageTitle = `${baseTitle} (${selectedLetter})`;
    }

    document.title = buildTabTitle({
      currentPageTitle,
      siteName: siteTitle,
    });
  }, [searchQuery, selectedLetter, siteTitle, genreTitle]);

  return (
    <main className="bg-[#fdfcf8] min-h-screen font-tarunima">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link>
          {genreTitle && (
            <>
              <span className="mx-2 text-white/50 shrink-0">/</span>
              <span className="font-medium text-white">{genreTitle}</span>
            </>
          )}
        </div>
      </nav>

      {/* বইয়ের গ্রিড ও ফিল্টার হেডার */}
      <div className="max-w-full mx-auto py-2 px-2">
        <div className="mb-2 border-b border-orange-200 pb-2">
          
          {/* হেডার রো: বামে টাইটেল, ডানে সার্চবার */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* টাইটেল ও কাউন্ট */}
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold font-sabrina text-[#996633]">
                {genreTitle ? `ঘরানা : ${genreTitle}` : `${siteTitle} গ্রন্থাগার`}
              </h2>
              <p className="text-gray-500 mt-1 italic font-tarunima text-sm">
                {filteredBooks.length > 0
                  ? `প্রকাশিত বইয়ের সংখ্যা ${toBengaliNumber(filteredBooks.length)}টি; আপনার পছন্দের বইটি বেছে নিন`
                  : "এই মুহূর্তে কোনো বই পাওয়া যায়নি"}
              </p>
            </div>

            {/* সার্চ বার */}
            <div className="w-full md:w-80 relative flex items-center">
              <input
                type="text"
                placeholder="বই অথবা লেখকের নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 text-sm bg-white border border-orange-200 rounded shadow-xs focus:outline-hidden focus:ring-1 focus:ring-[#996633] focus:border-[#996633] text-gray-800 placeholder-gray-400"
              />
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  মুছুন
                </button>
              )}
            </div>
          </div>

          {/* আদ্যক্ষর ফিল্টার বাটন */}
          {availableAlphabets.length > 1 && (
            <div className="mt-3 w-full flex flex-wrap items-center justify-center gap-0.5 py-1 px-2 bg-orange-50/50 rounded border border-orange-100 text-xs sm:text-sm md:text-base lg:text-lg font-tarunima shadow-xs">
              {availableAlphabets.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    selectedLetter === letter
                      ? 'bg-[#996633] text-white font-bold shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-orange-100 border border-gray-100'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* বইয়ের গ্রিড */}
        {currentBooks.length === 0 ? (
          <div className="text-center py-12 font-tarunima text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto text-orange-200 mb-2" />
            <p>আপনার অনুসন্ধান অনুযায়ী কোনো বই পাওয়া যায়নি।</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-6 xl:grid-cols-8 gap-2 pb-4 border-b border-red-100">
              {currentBooks.map((book) => {
                const bookKey = book.slug || book.id || '';
                return (
                  <Link
                    key={bookKey}
                    href={`/book/${bookKey}`}
                    className="group font-tarunima flex flex-col h-full"
                  >
                    {/* কভার ইমেজ কার্ড */}
                    <div className="relative aspect-2/3 overflow-hidden rounded shadow-lg bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                      <img
                        src={book.cover_image || book.cover || '/default-cover.jpg'}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>

                    {/* বইয়ের তথ্য */}
                    <div className="mt-1 flex flex-col grow font-tarunima">
                      <h3 className="text-lg text-center font-bold text-gray-900 group-hover:text-red-900 transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-center text-gray-500 mt-1 uppercase tracking-tight">
                        {book.author || 'অজানা লেখক'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* আরও বই দেখুন বাটন */}
            <div className="py-6 flex justify-center items-center">
              {hasMore && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + limit)}
                  className="px-6 py-2 bg-[#996633] text-white rounded font-tarunima text-sm hover:bg-[#805326] shadow-sm transition-all cursor-pointer"
                >
                  আরও বই দেখুন
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}