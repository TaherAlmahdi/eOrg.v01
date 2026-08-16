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

export interface Book {
  slug: string;
  title: string;
  author?: string;
  cover_image?: string;
  cover?: string;
}

interface BooksPageClientProps {
  initialBooks: Book[];
  siteTitle: string;
}

export default function BooksPageClient({ initialBooks = [], siteTitle }: BooksPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('সব');

  // ১. নিরাপদভাবে বাংলা শিরোনাম অনুযায়ী বর্ণানুক্রমিক (অ-হ) সাজানো
  const sortedBooks = useMemo(() => {
    const safeBooks = Array.isArray(initialBooks) ? initialBooks : [];
    return [...safeBooks].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', 'bn')
    );
  }, [initialBooks]);

  // ২. সিস্টেমে বিদ্যমান বইগুলোর প্রথম অক্ষর থেকে অটোমেটিক ফিল্টার বাটন তৈরি
  const availableAlphabets = useMemo(() => {
    const lettersSet = new Set<string>();

    sortedBooks.forEach((book) => {
      const firstChar = (book.title || '').trim().charAt(0);
      if (firstChar) {
        lettersSet.add(firstChar);
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, 'bn')
    );

    return ['সব', ...sortedLetters];
  }, [sortedBooks]);

  // ৩. সার্চ (বই বা লেখক) এবং আদ্যক্ষর ফিল্টারিং লজিক
  const filteredBooks = useMemo(() => {
    return sortedBooks.filter((book) => {
      const titleMatchesSearch = (book.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const authorMatchesSearch = (book.author || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatchesSearch || authorMatchesSearch;

      const titleFirstChar = (book.title || '').trim().charAt(0);
      const matchesLetter = selectedLetter === 'সব' || titleFirstChar === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [sortedBooks, searchQuery, selectedLetter]);

  // 🏷️ ৪. buildTabTitle ব্যবহার করে ডায়নামিক ব্রাউজার ট্যাবটাইটেল আপডেট
  useEffect(() => {
    let currentPageTitle = 'গ্রন্থাগার';

    if (searchQuery.trim()) {
      currentPageTitle = `গ্রন্থাগার (খুঁজছেন: ${searchQuery.trim()})`;
    } else if (selectedLetter !== 'সব') {
      currentPageTitle = `গ্রন্থাগার (${selectedLetter})`;
    }

    document.title = buildTabTitle({
      currentPageTitle,
      siteName: siteTitle,
    });
  }, [searchQuery, selectedLetter, siteTitle]);

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-red-100 shrink-0">গ্রন্থাগার</Link>
        </div>
      </nav>

      {/* বইয়ের গ্রিড ও ফিল্টার হেডার */}
      <div className="max-w-full mx-auto py-2 px-2">
        <div className="mb-2 border-b border-orange-200 pb-2">
          <h2 className="text-2xl text-center font-bold font-sabrina text-[#996633]">
            {siteTitle} গ্রন্থাগার
          </h2>
          <p className="text-gray-500 mt-2 text-center italic font-tarunima">
            {filteredBooks.length > 0
              ? `প্রকাশিত বইয়ের সংখ্যা ${toBengaliNumber(filteredBooks.length)}টি; আপনার পছন্দের বইটি বেছে নিন`
              : "এই মুহূর্তে কোনো বই পাওয়া যায়নি"}
          </p>

          {/* 🔍 সার্চ ও অটোমেটিক ডায়নামিক ফিল্টার সেকশন */}
          <div className="mt-4 w-full space-y-3 font-tarunima">
            {/* সার্চ বার: ৩ গুণ প্রশস্ত (max-w-3xl) এবং স্ক্রিনের মাঝে (mx-auto) সেটার করা */}
            <div className="relative w-full max-w-2xl mx-auto flex items-center">
              <input
                type="text"
                placeholder="বই অথবা লেখকের নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 text-sm bg-white border border-orange-200 rounded shadow-xs focus:outline-hidden focus:ring-1 focus:ring-[#996633] focus:border-[#996633] text-gray-800"
              />
              <Search className="absolute left-3 w-4 h-4 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  মুছুন
                </button>
              )}
            </div>

            {/* ডায়নামিক আদ্যক্ষর ফিল্টার বাটন: ফুল ওয়াইড (w-full) এবং রেসপনসিভ ডাইনামিক ফন্ট সাইজিং (text-xs sm:text-sm md:text-base lg:text-lg) */}
            {availableAlphabets.length > 1 && (
              <div className="w-full flex flex-wrap items-center justify-center gap-0.5 py-1 px-2 bg-orange-50/50 rounded border border-orange-100 text-xs sm:text-sm md:text-base lg:text-lg font-tarunima shadow-xs">
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
        </div>

        {/* বইয়ের গ্রিড */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 font-tarunima text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto text-orange-200 mb-2" />
            <p>আপনার অনুসন্ধান অনুযায়ী কোনো বই পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 gap-2 pb-4 border-b border-red-100">
            {filteredBooks.map((book) => (
              <Link
                key={book.slug}
                href={`/book/${book.slug}`}
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
            ))}
          </div>
        )}
      </div>
    </main>
  );
}