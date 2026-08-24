'use client';

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Home } from "lucide-react";

// বাংলা ও ইউনিকোড নরমালাইজেশন
const normalizeBengali = (text: string = ''): string => {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/\u09af\u09bc/g, 'য়')
    .replace(/\u09a1\u09bc/g, 'ড়')
    .replace(/\u09a2\u09bc/g, 'ঢ়')
    .replace(/\u09b0\u09bc/g, 'র')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
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
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
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

  // ২. টাইটেল থেকে ইউনিক প্রথম বর্ণমালা বের করা
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

    return Array.from(lettersSet).sort((a, b) => a.localeCompare(b, 'bn', { sensitivity: 'base' }));
  }, [sortedItems]);

  // ৩. সার্চ এবং বর্ণ অনুযায়ী লাইভ ফিল্টারিং
  const filtered = useMemo(() => {
    const query = normalizeBengali(search);

    return sortedItems.filter((entry: any) => {
      const rawTitle = extractFieldText(entry.title, "শিরোনামহীন");
      const rawBook = extractFieldText(entry.bookTitle || entry.book, "");
      const rawAuthor = extractFieldText(entry.author, "");

      if (selectedLetter) {
        const firstChar = rawTitle.normalize('NFC').trim().charAt(0);
        const formattedChar = /^[a-zA-Z]$/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
        if (formattedChar !== selectedLetter) return false;
      }

      if (!query) return true;

      return (
        normalizeBengali(rawTitle).includes(query) ||
        normalizeBengali(rawBook).includes(query) ||
        normalizeBengali(rawAuthor).includes(query)
      );
    });
  }, [sortedItems, search, selectedLetter]);

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [search, selectedLetter, itemsPerPage]);

  const currentItems = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return (
    <main className="w-full px-2 md:px-4 py-3 font-tarunima space-y-3">
      {/* ব্রেডক্রাম্ব */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/items" className="hover:text-red-100 shrink-0">প্রকরণ</Link>
          {displayTitle && displayTitle !== 'সকল আইটেম' && (
            <>
              <span className="mx-2 text-white/50 shrink-0">/</span>
              <span className="hover:text-red-100 shrink-0">{displayTitle}</span>
            </>
          )}
        </div>
      </nav>

      {/* হেডার ও সার্চ */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-2 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-950">
            প্রকরণ : <span className="text-[#008080]">{displayTitle || 'নির্বাচিত প্রকরণ'}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            সর্বমোট {toBengaliNumber(filtered.length)}টি পাতা রয়েছে
          </p>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <input
            className="w-full px-4 py-2 pl-10 text-sm bg-white border border-teal-200 rounded focus:ring-1 focus:ring-[#008080] outline-none shadow-xs"
            placeholder="শিরোনাম, মূল গ্রন্থ বা লেখক খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </header>

      {/* বর্ণানুক্রমিক ফিল্টার বার */}
      {availableLetters.length > 0 && (
        <div className="flex items-center justify-center gap-1 flex-wrap bg-teal-50/50 px-2 rounded border border-teal-100">
          <button
            type="button"
            onClick={() => setSelectedLetter(null)}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${selectedLetter === null
                ? 'bg-[#008080] text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-teal-100 border border-teal-200'
              }`}
          >
            সব
          </button>

          {availableLetters.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${selectedLetter === letter
                  ? 'bg-[#008080] text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-teal-100 border border-teal-200'
                }`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {/* কনটেন্ট গ্রিড */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded border border-dashed border-gray-300">
          কোনো পাতা পাওয়া যায়নি।
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-1">
            {currentItems.map((item: any, idx: number) => {
              const itemTitle = extractFieldText(item.title, "শিরোনামহীন");
              const bookTitle = extractFieldText(item.bookTitle || item.book, "—");
              const authorName = extractFieldText(item.author, "—");

              // slugify ব্যবহার না করে সরাসরি টাইটেল বা ফ্রন্টম্যাটারের স্লাগ ব্যবহার করার সঠিক কোড:

              const resolvedTitleSlug = item.slug
                ? String(item.slug).trim()
                : (item.itemSlug ? String(item.itemSlug).trim() : itemTitle);

              const pageUrl = `/item/${currentPrakaronSlug}/${encodeURIComponent(resolvedTitleSlug)}`;

              const bookSlug = item.bookSlug ? item.bookSlug : slugify(bookTitle);
              const authorSlug = item.authorSlug ? item.authorSlug : slugify(authorName);

              return (
                <div
                  key={item.id || `${resolvedTitleSlug}-${idx}`}
                  className="bg-white border border-teal-100 rounded p-2 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-center"
                >
                  <div className="hidden md:flex items-center flex-wrap gap-x-2 px-2 text-base">
                    <Link
                      href={pageUrl}
                      className="font-bold text-[#008080] hover:text-[#cc7a00] no-underline transition-colors"
                    >
                      {itemTitle}
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href={`/book/${bookSlug}`}
                      className="text-teal-700 hover:text-[#cc7a00] no-underline transition-colors"
                    >
                      {bookTitle}
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link
                      href={`/author/${authorSlug}`}
                      className="text-gray-600 hover:text-[#cc7a00] no-underline transition-colors"
                    >
                      {authorName}
                    </Link>
                  </div>

                  <div className="flex md:hidden flex-col space-y-2">
                    <Link
                      href={pageUrl}
                      className="text-base font-bold text-[#008080] hover:text-[#cc7a00] transition-colors"
                    >
                      {itemTitle}
                    </Link>
                    <div className="flex items-center flex-wrap gap-x-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
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

          {/* পেজিনেশন বাটন */}
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