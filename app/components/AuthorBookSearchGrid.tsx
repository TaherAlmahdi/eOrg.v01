'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, Book, X, User } from 'lucide-react';

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

// 🔹 Cloudflare R2 Media Base URL ফরম্যাটিং হেল্পার
const getCoverImageUrl = (coverPath?: string | null): string => {
  if (!coverPath) return '';

  let rawPath = coverPath.trim().replace(/\\/g, '/');

  if (rawPath.startsWith('public/')) {
    rawPath = rawPath.replace('public/', '');
  } else if (rawPath.startsWith('/public/')) {
    rawPath = rawPath.replace('/public/', '');
  }

  const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

  return cleanPath.startsWith('http://') || cleanPath.startsWith('https://')
    ? cleanPath
    : `https://media.eduliture.org/${cleanPath}`;
};

export interface BookItem {
  id?: string;
  title: string;
  slug?: string;
  author?: string | string[];
  author_name?: string | string[];
  writer?: string | string[];
  authors?: string | string[];
  translator?: string | string[];
  translator_name?: string | string[];
  translators?: string | string[];
  editor?: string | string[];
  editor_name?: string | string[];
  editors?: string | string[];
  coverImage?: string;
  cover?: string;
  cover_image?: string;
}

interface AuthorBookSearchGridProps {
  books?: BookItem[];
  siteName?: string;
  personName: string;
}

const isFieldMatch = (field: unknown, targetName: string): boolean => {
  if (!field) return false;
  const target = targetName.trim().toLowerCase();

  if (Array.isArray(field)) {
    return field.some((item) => {
      if (typeof item === 'string') {
        const val = item.trim().toLowerCase();
        return val === target || val.includes(target);
      }
      return false;
    });
  }

  if (typeof field === 'string') {
    const val = field.trim().toLowerCase();
    return val === target || val.includes(target);
  }

  return false;
};

export default function AuthorBookSearchGrid({
  books = [],
  siteName = 'এডুলিচার পাঠশালা',
  personName = '',
}: AuthorBookSearchGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('সব');

  // 🔹 ফিল্টার ও বাংলা বর্ণানুক্রমিকভাবে (Alphabetical order) সর্টিং
  const personBooks = useMemo(() => {
    const safeBooks = Array.isArray(books) ? books : [];

    const matchedBooks = safeBooks.filter((book) => {
      if (!book || !book.title) return false;
      if (!personName.trim()) return true;

      const targetName = personName.trim();

      const matchesAuthor = isFieldMatch(
        book.author || book.author_name || book.writer || book.authors,
        targetName
      );
      const matchesTranslator = isFieldMatch(
        book.translator || book.translator_name || book.translators,
        targetName
      );
      const matchesEditor = isFieldMatch(
        book.editor || book.editor_name || book.editors,
        targetName
      );

      return matchesAuthor || matchesTranslator || matchesEditor;
    });

    return matchedBooks.sort((a, b) =>
      a.title.trim().localeCompare(b.title.trim(), 'bn', { numeric: true })
    );
  }, [books, personName]);

  // 🔹 টাইটেলের ১ম অক্ষর নিয়ে ডায়নামিক লেটার বাটন তৈরি
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

  // 🔹 সিলেক্ট করা অক্ষর এবং সার্চ কোয়েরি অনুযায়ী ফিল্টারকৃত বই
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

  const displayTitle = personName ? `${personName} রচনাবলী` : 'গ্রন্থাবলী';

  return (
    <main className="bg-[#fdfcf8] min-h-screen font-tarunima">
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="flex items-center max-w-full mx-auto text-sm font-tarunima whitespace-nowrap">
          <Link href="/" className="transition-colors shrink-0 hover:text-orange-200">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="transition-colors hover:text-orange-200">
            গ্রন্থাগার
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/authors" className="transition-colors hover:text-orange-200">
            লেখক নির্ঘণ্ট
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="flex items-center gap-2 font-medium">
            {personName}
          </span>
        </div>
      </nav>

      <div className="mx-auto max-w-full px-2 py-4">
        {/* 🔹 হেডার সেকশন: টাইটেল, সার্চবার এবং বর্ণমালা ফিল্টার */}
        <header className="mb-3 space-y-3 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* বামপাশে পেজ টাইটেল ও তথ্য */}
            <div className="rounded bg-teal-50/90 text-[#008080] border border-teal-200 shadow-xs backdrop-blur-md self-start md:self-auto w-full md:w-auto">
              <div className="p-2.5 inline-flex items-center gap-2">
                <User size={22} className="shrink-0 animate-pulse text-[#008080]" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-950 leading-none">
                  <span className="text-[#008080]">{displayTitle}</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                <span className="w-full text-xs md:text-sm font-normal text-teal-700 bg-teal-100/70 px-2 py-1 border-t border-teal-200 inline-block">
                  {personBooks.length > 0
                    ? `${siteName ? `${siteName}য় ` : ''}প্রকাশিত মোট ${toBengaliNumber(personBooks.length)}টি বই রয়েছে`
                    : "বর্তমানে কোনো বই পাওয়া যায়নি"}
                </span>
              </p>
            </div>

            {/* ডানপাশে সার্চবার (মোবাইলে নিচে ফুল-ওয়াইড) */}
            {personBooks.length > 0 && (
              <div className="relative w-full md:w-80 shrink-0">
                <Search className="absolute w-4 h-4 text-teal-600 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="বইয়ের নাম দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-teal-200 rounded focus:outline-none focus:ring-1 focus:ring-[#008080] text-sm bg-teal-50/30 text-gray-800 shadow-xs placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ফুল-ওয়াইড ও সেন্টারাইজড আদ্যক্ষর ফিল্টারিং */}
          {personBooks.length > 0 && dynamicLetters.length > 1 && (
            <div className="p-2 border border-teal-100 rounded bg-teal-50/90 backdrop-blur-md shadow-xs">
              <div className="flex flex-wrap items-center justify-center gap-1">
                {dynamicLetters.map((letter) => {
                  const isActive = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(letter)}
                      className={`px-2 py-1 text-xs md:text-sm font-semibold rounded transition-colors cursor-pointer ${isActive
                        ? "bg-[#008080] text-white shadow-xs"
                        : "bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-[#008080] border border-transparent hover:border-teal-200"
                        }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* 🔹 বুক গ্রিড ডিসপ্লে */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 md:gap-2 w-full pb-4">
            {filteredBooks.map((book) => {
              const bookSlug =
                book.slug || encodeURIComponent(book.title.toLowerCase());
              const rawCoverSrc = book.coverImage || book.cover || book.cover_image;
              const coverSrc = getCoverImageUrl(rawCoverSrc);

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
        ) : (
          <div className="py-24 text-center border-2 border-orange-100 border-dashed rounded-2xl">
            <Book size={48} className="mx-auto mb-4 text-orange-200" />
            <p className="text-lg italic text-gray-400">
              {searchQuery.trim() !== ''
                ? `"${searchQuery}" নামে কোনো বই পাওয়া যায়নি।`
                : selectedLetter !== 'সব'
                  ? `"${selectedLetter}" অক্ষর দিয়ে কোনো বই পাওয়া যায়নি।`
                  : `${personName}-এর কোনো বই পাওয়া যায়নি।`}
            </p>
            {(selectedLetter !== 'সব' || searchQuery.trim() !== '') && (
              <button
                onClick={() => {
                  setSelectedLetter('সব');
                  setSearchQuery('');
                }}
                className="inline-block mt-4 font-medium text-[#008080] hover:underline cursor-pointer"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}