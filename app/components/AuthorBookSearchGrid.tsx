'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Book, X } from 'lucide-react';

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

export interface BookItem {
  id?: string;
  title: string;
  slug?: string;
  author?: string;
  author_name?: string;
  writer?: string;
  translator?: string;
  translator_name?: string;
  editor?: string;
  editor_name?: string;
  coverImage?: string;
  cover?: string;
  cover_image?: string;
}

interface AuthorBookSearchGridProps {
  books?: BookItem[];
  siteName?: string;
  personName: string; // 👈 যে নামে ক্লিক করা হয়েছে (বাধ্যতামূলক প্রপস)
}

export default function AuthorBookSearchGrid({
  books = [],
  siteName = 'এডুলিচার পাঠশালা',
  personName = '',
}: AuthorBookSearchGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('সব');

  // 🔹 ১. যে ব্যক্তির নাম পাস করা হয়েছে, তাঁর সাথে সম্পর্কিত বইগুলো আগে আলাদা করা
  const personBooks = useMemo(() => {
    const safeBooks = Array.isArray(books) ? books : [];
    if (!personName.trim()) return safeBooks;

    const targetName = personName.trim().toLowerCase();

    return safeBooks.filter((book) => {
      if (!book) return false;

      const author = (book.author || book.author_name || book.writer || '').toLowerCase();
      const translator = (book.translator || book.translator_name || '').toLowerCase();
      const editor = (book.editor || book.editor_name || '').toLowerCase();

      // লেখক, অনুবাদক বা সম্পাদক - যেকোনো এক জায়গায় নাম মিললেই বইটি নিবে
      return (
        author.includes(targetName) ||
        translator.includes(targetName) ||
        editor.includes(targetName)
      );
    });
  }, [books, personName]);

  // 🔹 ২. ফিল্টার করা বইগুলোর নাম থেকে আদ্যক্ষরের তালিকা (Alphabet filter)
  const dynamicLetters = useMemo(() => {
    const lettersSet = new Set<string>();

    personBooks.forEach((book) => {
      if (book && book.title) {
        const firstChar = book.title.trim().charAt(0).toUpperCase();
        if (firstChar) {
          lettersSet.add(firstChar);
        }
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, 'bn')
    );

    return ['সব', ...sortedLetters];
  }, [personBooks]);

  // 🔹 ৩. সার্চ বক্স এবং আদ্যক্ষর অনুযায়ী বই ফিল্টার করা
  const filteredBooks = useMemo(() => {
    return personBooks.filter((book) => {
      if (!book || !book.title) return false;

      const title = book.title.trim();
      const firstChar = title.charAt(0).toUpperCase();

      const matchesLetter =
        selectedLetter === 'সব' || firstChar === selectedLetter;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = title.toLowerCase().includes(query);

      return matchesLetter && matchesSearch;
    });
  }, [personBooks, selectedLetter, searchQuery]);

  return (
    <div className="space-y-5 w-full">
      {/* 🔹 ডাইনামিক হেডার: যে নামে ক্লিক করা হয়েছে সেই নামই আসবে */}
      <div className="text-center font-tarunima mb-2">
        <h2 className="text-lg md:text-xl font-bold text-[#008080]">
          {personName ? `${personName} রচনাবলী` : 'গ্রন্থাবলী'}
        </h2>
        <p className="text-gray-600 text-sm">
          {siteName ? `${siteName}য়` : ''} প্রকাশিত গ্রন্থ সংখ্যা: {toBengaliNumber(personBooks.length)} টি
        </p>
      </div>

      {/* 🔹 সার্চ ইনপুট */}
      <div className="relative w-full md:w-96 md:mx-auto">
        <input
          type="text"
          placeholder="বইয়ের নাম দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-teal-200 rounded focus:outline-none focus:ring-2 focus:ring-[#008080]/30 focus:border-[#008080] transition-all shadow-xs"
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

      {/* 🔹 আদ্যক্ষর ফিল্টার বার */}
      {dynamicLetters.length > 1 && (
        <div className="w-full bg-white/70 backdrop-blur-xs p-2.5 rounded border border-teal-100/80 shadow-xs">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {dynamicLetters.map((letter) => {
              const isActive = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-3 py-1 text-xs md:text-sm font-semibold rounded transition-all duration-200 ${
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

      {/* 🔹 বইয়ের গ্রিড বা নো-ডাটা বার্তা */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">
            {searchQuery.trim() !== ''
              ? `${searchQuery} নামে কোন বই পাওয়া যায়নি।`
              : selectedLetter !== 'সব'
              ? `${selectedLetter} অক্ষর দিয়ে কোন বই পাওয়া যায়নি।`
              : `${personName}-এর কোন বই পাওয়া যায়নি।`}
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 md:gap-2 w-full">
          {filteredBooks.map((book) => {
            const bookSlug =
              book.slug || encodeURIComponent(book.title.toLowerCase());
            const coverSrc = book.coverImage || book.cover || book.cover_image;

            return (
              <Link
                key={book.id || bookSlug}
                href={`/book/${bookSlug}`}
                className="group flex flex-col bg-white rounded border border-teal-100/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-300 overflow-hidden"
              >
                <div className="relative w-full aspect-2/3 bg-amber-50/50 flex items-center justify-center overflow-hidden border-b border-gray-100">
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