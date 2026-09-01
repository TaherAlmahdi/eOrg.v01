'use client';

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Home, Layers, BookOpen } from "lucide-react";

// 🔹 বাংলা বর্ণ ও স্পেস নরমালাইজ করার উন্নত হেল্পার ফাংশন
const normalizeBengaliText = (text: string = ''): string => {
  if (!text) return '';
  return text
    .normalize('NFC') // ইউনিকোড নরমাল এনকোডিং
    .toLowerCase()
    // সমতুল্য বাংলা বর্ণ ও নুকতা সামঞ্জস্যকরণ
    .replace(/\u09af\u09bc/g, "য়")
    .replace(/\u09a1\u09bc/g, "ড়")
    .replace(/\u09a2\u09bc/g, "ঢ়")
    .replace(/\u09b0\u09bc/g, "র")
    .replace(/য়/g, "য")
    .replace(/ড়/g, "র")
    .replace(/ঢ়/g, "র")
    .replace(/ব়/g, "র")
    .replace(/়/g, "") // যেকোনো অবশিষ্ট নুকতা রিমুভ
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // জিরো-উইডথ ক্যারেক্টার রিমুভ
    .replace(/[\s\-_]+/g, ""); // স্পেস, হাইফেন ও আন্ডারস্কোর রিমুভ
};

const slugify = (text: string = ''): string => {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u0980-\u09FF\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const extractFieldText = (field: any, fallback: string = "—"): string => {
  if (!field) return fallback;
  if (typeof field === "string") return field.trim() || fallback;
  if (typeof field === "object") return field.name || field.title || fallback;
  return fallback;
};

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

interface ItemViewClientProps {
  initialItems?: any[];
  displayTitle?: string;
  itemSlug?: string;
  slugsArray?: string[];
}

export default function ItemViewClient({
  initialItems = [],
  displayTitle = "",
  itemSlug = "",
}: ItemViewClientProps) {
  const [search, setSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("সব");
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // স্ক্রিন সাইজ অনুযায়ী পেজিনেশন সাইজ নির্ধারণ
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const count = width < 768 ? 25 : width >= 1536 ? 60 : 45;
        setItemsPerPage(count);
      }, 150);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const currentPrakaronSlug = itemSlug ? slugify(itemSlug) : slugify(displayTitle);

  // ১. প্রাথমিক ডাটা সর্টিং
  const sortedItems = useMemo(() => {
    if (!initialItems || !Array.isArray(initialItems)) return [];

    return [...initialItems].sort((a: any, b: any) => {
      const titleA = extractFieldText(a.title, "").normalize('NFC');
      const titleB = extractFieldText(b.title, "").normalize('NFC');
      return titleA.localeCompare(titleB, 'bn', { sensitivity: 'base' });
    });
  }, [initialItems]);

  // ২. টাইটেল থেকে ইউনিক আদ্যক্ষর বের করা
  const availableLetters = useMemo(() => {
    const lettersSet = new Set<string>();

    sortedItems.forEach((entry: any) => {
      const title = extractFieldText(entry.title, "").normalize('NFC');
      if (title && title !== "—" && title !== "শিরোনামহীন") {
        const firstChar = title.trim().charAt(0);
        if (firstChar) {
          const formattedChar = /^[a-zA-Z]$/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
          lettersSet.add(formattedChar);
        }
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, 'bn', { sensitivity: 'base' })
    );

    return ["সব", ...sortedLetters];
  }, [sortedItems]);

  // ৩. সার্চ এবং বর্ণ অনুযায়ী নরমালাইজড ফিল্টারিং
  const filtered = useMemo(() => {
    const normalizedQuery = normalizeBengaliText(search);

    return sortedItems.filter((entry: any) => {
      const rawTitle = extractFieldText(entry.title, "শিরোনামহীন");
      const rawBook = extractFieldText(entry.bookTitle || entry.book, "");
      const rawAuthor = extractFieldText(entry.author, "");

      // আদ্যক্ষর ফিল্টারিং
      const firstChar = rawTitle.normalize('NFC').trim().charAt(0);
      const formattedChar = /^[a-zA-Z]$/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
      const matchesLetter = selectedLetter === "সব" || formattedChar === selectedLetter;

      if (!matchesLetter) return false;
      if (!normalizedQuery) return true;

      // নরমালাইজড টেক্সট সার্চ
      return (
        normalizeBengaliText(rawTitle).includes(normalizedQuery) ||
        normalizeBengaliText(rawBook).includes(normalizedQuery) ||
        normalizeBengaliText(rawAuthor).includes(normalizedQuery)
      );
    });
  }, [sortedItems, search, selectedLetter]);

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [search, selectedLetter, itemsPerPage]);

  const currentItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return (
    <main className="w-full font-tarunima px-0 py-0 space-y-3">
      {/* ব্রেডক্রাম্ব */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar shadow-xs rounded-t">
        <div className="max-w-full mx-auto text-sm flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0 hover:text-teal-200 transition-colors">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/items" className="hover:text-teal-200 transition-colors shrink-0">
            প্রকরণ
          </Link>
          {displayTitle && displayTitle !== 'সকল আইটেম' && (
            <>
              <span className="mx-2 text-white/50 shrink-0">/</span>
              <span className="text-teal-100 shrink-0">{displayTitle}</span>
            </>
          )}
        </div>
      </nav>

      {/* পেজ টাইটেল, কাউন্টার ও সার্চবার */}
      <div className="mb-3 space-y-3 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          {/* বামপাশে ডাইনামিক পেজ টাইটেল */}
          <div className="w-full md:w-auto rounded bg-teal-50/90 text-[#008080] text-center border border-teal-200 shadow-xs backdrop-blur-md overflow-hidden">
            <div className="p-2.5 inline-flex items-center gap-2">
              <Layers size={22} className="shrink-0 animate-pulse text-[#008080]" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-950 leading-none">
                <span className="text-[#008080]">{displayTitle || 'নির্বাচিত প্রকরণ'}</span>{' '}
                <span className="text-[#008080]">সম্ভার</span>
              </h1>
            </div>
            {filtered.length > 0 && (
              <p className="text-xs md:text-sm text-gray-500">
                <span className="w-full text-xs md:text-sm font-normal text-teal-700 bg-teal-100/70 px-2 py-1 border-t border-teal-200 inline-block">
                  সর্বমোট {toBengaliNumber(filtered.length)}টি {displayTitle || 'নির্বাচিত প্রকরণ'} রয়েছে
                </span>
              </p>
            )}
          </div>

          {/* ডানপাশে সার্চবার */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute w-4 h-4 text-teal-600 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="শিরোনাম, মূল গ্রন্থ বা লেখক খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-teal-200 rounded focus:outline-none focus:ring-1 focus:ring-[#008080] text-sm bg-teal-50/30 text-gray-800 shadow-xs placeholder-gray-400"
            />
          </div>

        </div>

        {/* সেন্টারে আদ্যক্ষর ফিল্টার বার */}
        {availableLetters.length > 1 && (
          <div className="p-2 border border-teal-100 rounded bg-teal-50/90 backdrop-blur-md shadow-xs">
            <div className="flex flex-wrap items-center justify-center gap-1">
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2 py-1 text-xs md:text-sm font-semibold rounded transition-colors cursor-pointer ${selectedLetter === letter
                    ? "bg-[#008080] text-white shadow-xs"
                    : "bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-[#008080] border border-transparent hover:border-teal-200"
                    }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* কনটেন্ট গ্রিড */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-500 rounded bg-white border border-dashed border-gray-300">
          কোনো পাতা পাওয়া যায়নি।
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-2">
            {currentItems.map((item: any, idx: number) => {
              const itemTitle = extractFieldText(item.title, "শিরোনামহীন");
              const bookTitle = extractFieldText(item.bookTitle || item.book, "—");
              const authorName = extractFieldText(item.author, "—");

              const resolvedTitleSlug = item.slug
                ? String(item.slug).trim()
                : (item.itemSlug ? String(item.itemSlug).trim() : itemTitle);

              const pageUrl = `/item/${currentPrakaronSlug}/${encodeURIComponent(resolvedTitleSlug)}`;
              const bookSlug = item.bookSlug ? item.bookSlug : slugify(bookTitle);
              const authorSlug = item.authorSlug ? item.authorSlug : slugify(authorName);

              return (
                <div
                  key={item.id || `${resolvedTitleSlug}-${idx}`}
                  className="bg-white border border-teal-100 rounded p-2.5 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-200 flex flex-col justify-center"
                >
                  {/* ডেস্কটপ ও ট্যাবলেট ভিউ */}
                  <div className="hidden md:flex items-center flex-wrap gap-x-2 text-sm md:text-base">
                    <Link
                      href={pageUrl}
                      className="font-bold text-[#008080] hover:text-[#cc7a00] no-underline transition-colors"
                    >
                      {itemTitle}
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href={`/book/${bookSlug}`}
                      className="text-teal-700 hover:text-[#cc7a00] no-underline transition-colors text-sm"
                    >
                      {bookTitle}
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href={`/author/${authorSlug}`}
                      className="text-gray-600 hover:text-[#cc7a00] no-underline transition-colors text-sm"
                    >
                      {authorName}
                    </Link>
                  </div>

                  {/* মোবাইল ভিউ */}
                  <div className="flex md:hidden flex-col space-y-1.5">
                    <Link
                      href={pageUrl}
                      className="text-base font-bold text-[#008080] hover:text-[#cc7a00] transition-colors"
                    >
                      {itemTitle}
                    </Link>
                    <div className="flex items-center flex-wrap gap-x-2 text-xs text-gray-600 pt-1 border-t border-teal-50">
                      <Link
                        href={`/book/${bookSlug}`}
                        className="text-teal-700 hover:text-[#cc7a00] no-underline transition-colors"
                      >
                        {bookTitle}
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/author/${authorSlug}`}
                        className="hover:text-[#cc7a00] no-underline transition-colors"
                      >
                        {authorName}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* লোড মোর বাটন */}
          {visibleCount < filtered.length && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + itemsPerPage)}
                className="px-6 py-2.5 bg-[#008080] text-white font-medium text-sm rounded shadow-sm hover:bg-[#006666] transition-colors cursor-pointer"
              >
                আরও {toBengaliNumber(Math.min(itemsPerPage, filtered.length - visibleCount))} টি দেখুন
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}