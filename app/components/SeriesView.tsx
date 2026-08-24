"use client";

import { useState, useMemo, FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, BookOpen, Search, X, Layers } from "lucide-react";

// 🔹 মূল বইয়ের টাইপ (টাইপ-এরর সমাধানের জন্য আপডেট করা হয়েছে)
export interface SeriesBook {
  id?: string;
  slug: string;
  title: string;
  author?: string;
  cover?: string;
  Series?: string | string[] | any;
  series?: string | string[] | any;
  series_list?: any;
  series_info?: any;
  series_order?: string | number;
  series_index?: string | number;
  first_published?: number | string;
  published?: number | string;
  authorSlug?: string;
  [key: string]: any; // ব্যাকএন্ডের অন্যান্য ডাইনামিক ফিল্ডের জন্য
}

export type BookSeries = SeriesBook;
export type BookItem = SeriesBook;

export interface SeriesViewProps {
  seriesTitle: string;
  books?: SeriesBook[];
  subdomain?: string;
}

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

/**
 * 🔹 যেকোনো ভাষার (বাংলা, ইংরেজি, আরবি ইত্যাদি) মূল আদ্যক্ষর বের করার সার্বজনীন ফাংশন
 */
const getUniversalFirstLetter = (str: string): string => {
  if (!str) return "";
  const cleaned = str.trim();
  if (!cleaned) return "";

  // ১. Intl.Segmenter দিয়ে যেকোনো ভাষার সম্পূর্ণ প্রথম বর্ণ আলাদা করা
  let firstGrapheme = cleaned;
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const segments = Array.from(segmenter.segment(cleaned));
    if (segments.length > 0) {
      firstGrapheme = segments[0].segment;
    }
  } else {
    firstGrapheme = cleaned.charAt(0);
  }

  // ২. কার-চিহ্ন, ডায়াক্রিটিক্যাল মার্কস ও স্বরচিহ্ন রিমুভ করা
  const baseLetter = firstGrapheme
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u09be-\u09cd\u064b-\u065f]/g, "");

  // ইংরেজি হলে uppercase করা যাতে 'a' এবং 'A' আলাদা বাটন না হয়
  return baseLetter.toUpperCase();
};

export const SeriesView: FC<SeriesViewProps> = ({ seriesTitle, books = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // 🔹 ১. যেকোনো ভাষার বইয়ের তালিকা থেকে স্বয়ংক্রিয়ভাবে আদ্যক্ষরের তালিকা তৈরি
  const availableLetters = useMemo(() => {
    const lettersSet = new Set<string>();

    books.forEach((book) => {
      if (book.title) {
        const letter = getUniversalFirstLetter(book.title);
        if (letter) {
          lettersSet.add(letter);
        }
      }
    });

    return Array.from(lettersSet).sort((a, b) => a.localeCompare(b));
  }, [books]);

  // 🔹 ২. সার্চ ও নির্বাচিত আদ্যক্ষর অনুযায়ী ফিল্টারিং
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const firstLetter = getUniversalFirstLetter(book.title || "");
      const matchesLetter = selectedLetter ? firstLetter === selectedLetter : true;

      return matchesSearch && matchesLetter;
    });
  }, [books, searchQuery, selectedLetter]);

  return (
    <main className="bg-[#fdfcf8] min-h-screen font-tarunima">
      {/* নেভিগেশন বার */}
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
          <Link href="/series" className="transition-colors hover:text-orange-200 shrink-0">
            সিরিজ
          </Link>

          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="flex items-center gap-2 font-medium">
            {seriesTitle}
          </span>
        </div>
      </nav>

      {/* মূল কন্টেন্ট */}
      <div className="px-3 py-6 mx-auto max-w-full">
        <header className="mb-3 space-y-3 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            {/* বামপাশে ডাইনামিক পেজ টাইটেল */}
            <div className="rounded bg-teal-50/90 text-[#008080] border border-teal-200 shadow-xs backdrop-blur-md self-start md:self-auto">
              <div className="p-2.5 inline-flex items-center gap-2">
                <Layers size={22} className="shrink-0 animate-pulse text-[#008080]" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-950 leading-none">
                  <span className="text-[#008080]">{seriesTitle}</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                <span className="w-full text-xs md:text-sm font-normal text-teal-700 bg-teal-100/70 px-2 py-1 border-t border-teal-200 inline-block">
                  {books.length > 0
                    ? `এই সিরিজে মোট ${toBengaliNumber(books.length)}টি বই রয়েছে`
                    : "এই সিরিজে বর্তমানে কোনো বই নেই"}
                </span>
              </p>
            </div>

            {/* ডানপাশে সার্চবার */}
            {books.length > 0 && (
              <div className="relative w-full md:w-80 shrink-0">
                <Search className="absolute w-4 h-4 text-teal-600 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="বই বা লেখকের নাম দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-teal-200 rounded focus:outline-none focus:ring-1 focus:ring-[#008080] text-sm bg-teal-50/30 text-gray-800 shadow-xs placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

          </div>

          {/* নিচে: সেন্টারে আদ্যক্ষর ফিল্টার বার */}
          {books.length > 0 && availableLetters.length > 0 && (
            <div className="p-2 border border-teal-100 rounded bg-teal-50/90 backdrop-blur-md shadow-xs">
              <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                  onClick={() => setSelectedLetter(null)}
                  className={`px-2 py-1 text-xs md:text-sm font-semibold rounded transition-colors cursor-pointer ${selectedLetter === null
                      ? "bg-[#008080] text-white shadow-xs"
                      : "bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-[#008080] border border-transparent hover:border-teal-200"
                    }`}
                >
                  সব
                </button>

                {availableLetters.map((letter) => {
                  const isSelected = selectedLetter === letter;

                  return (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(isSelected ? null : letter)}
                      className={`px-2 py-1 text-xs md:text-sm font-semibold rounded transition-colors cursor-pointer ${isSelected
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

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 pb-4 border-b border-red-100">
            {filteredBooks.map((book) => {
              const bookSlug = book.slug || book.id;
              return (
                <Link
                  key={book.id || book.slug}
                  href={`/book/${bookSlug}`}
                  className="flex flex-col h-full group bg-white p-0 rounded border border-gray-200/80 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-orange-200"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t border-b border-gray-200/50 bg-gray-50">
                    <Image
                      src={book.cover || "/default-cover.jpg"}
                      alt={book.title || "বইয়ের প্রচ্ছদ"}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 transition-opacity opacity-0 bg-black/5 group-hover:opacity-100" />
                  </div>

                  <div className="mt-0 text-center flex flex-col justify-between bg-gray-200/50 p-2 grow">
                    <h3 className="text-base md:text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-xs md:text-sm text-gray-500 font-tarunima">
                      {book.author || "অজানা লেখক"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-orange-100 border-dashed rounded-2xl">
            <BookOpen size={48} className="mx-auto mb-4 text-orange-200" />
            <p className="text-lg italic text-gray-400">
              {books.length === 0
                ? "দুঃখিত, এই বিভাগে কোনো বই খুঁজে পাওয়া যায়নি।"
                : "আপনার অনুসন্ধানের সাথে মিল রেখে কোনো বই পাওয়া যায়নি।"}
            </p>
            {(searchQuery || selectedLetter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedLetter(null);
                }}
                className="inline-block mt-4 font-medium text-emerald-600 hover:underline"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default SeriesView;