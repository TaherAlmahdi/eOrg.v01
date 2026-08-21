'use client';
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Home, ChevronLeft } from "lucide-react";

// বাংলা ও ইউনিকোড নরমালাইজেশন (স্মার্ট সার্চের জন্য)
const normalizeBengali = (text: string = ''): string => {
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

const extractFieldText = (field: any, fallback: string = "—"): string => {
  if (!field) return fallback;
  if (typeof field === "string") return field.trim() || fallback;
  if (typeof field === "object") return field.name || field.title || fallback;
  return fallback;
};

export default function ItemViewClient({ initialItems, displayTitle }: any) {
  const [search, setSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // স্ক্রিন সাইজ অনুযায়ী প্রাথমিক আইটেম সংখ্যা নির্ধারণের স্টেট
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // স্ক্রিন সাইজ ট্র্যাক করে ডাইনামিক পেজিনেশন লিমিট সেট করা
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsPerPage(25);
        setVisibleCount(25);
      } else if (width >= 1536) {
        setItemsPerPage(60);
        setVisibleCount(60);
      } else {
        setItemsPerPage(45);
        setVisibleCount(45);
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  // ১. ইউনিক আদ্যক্ষর (Alphabet) তালিকা তৈরি
  const availableLetters = useMemo(() => {
    const lettersSet = new Set<string>();
    initialItems.forEach((item: any) => {
      const title = extractFieldText(item.title);
      if (title && title !== "—" && title !== "শিরোনামহীন") {
        const firstChar = title.trim().charAt(0);
        const formattedChar = /^[a-zA-Z]$/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
        lettersSet.add(formattedChar);
      }
    });
    return Array.from(lettersSet).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [initialItems]);

  // ২. সার্চ ও বর্ণানুক্রমিক ফিল্টারিং লজিক
  const filtered = useMemo(() => {
    return initialItems.filter((item: any) => {
      const titleText = extractFieldText(item.title);
      const bookText = extractFieldText(item.bookTitle || item.book);
      const authorText = extractFieldText(item.author);

      if (selectedLetter) {
        const firstChar = titleText.trim().charAt(0);
        const formattedChar = /^[a-zA-Z]$/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
        if (formattedChar !== selectedLetter) return false;
      }

      const query = normalizeBengali(search);
      if (!query) return true;

      const title = normalizeBengali(titleText);
      const book = normalizeBengali(bookText);
      const author = normalizeBengali(authorText);

      return title.includes(query) || book.includes(query) || author.includes(query);
    });
  }, [initialItems, search, selectedLetter]);

  useMemo(() => {
    setVisibleCount(itemsPerPage);
  }, [search, selectedLetter, itemsPerPage]);

  const currentItems = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage);
  };

  return (
    <main className="w-full px-2 md:px-4 py-3 font-tarunima space-y-3">

      {/* ব্রেডক্রাম সেকশন */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/items" className="hover:text-red-100 shrink-0">প্রকরণ</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="hover:text-red-100 shrink-0">{displayTitle}</span>
        </div>
      </nav>

      {/* হেডার সেকশন */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-2 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-950">
            প্রকরণ : <span className="text-[#008080]">{displayTitle}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {displayTitle} প্রকরণে সর্বমোট {filtered.length.toLocaleString("bn-BD")} টি {displayTitle} রয়েছে!
          </p>
        </div>

        {/* সার্চবার */}
        <div className="relative w-full md:w-80 shrink-0">
          <input
            className="w-full px-4 py-2 pl-10 text-sm bg-white border border-teal-200 rounded focus:ring-1 focus:ring-[#008080] outline-none shadow-xs"
            placeholder="শিরোনাম, মূল গ্রন্থ বা লেখক দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </header>

      {/* ৩. বর্ণানুক্রমিক ফিল্টার বার */}
      {availableLetters.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap bg-teal-50/50 p-1 rounded border border-teal-100">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${selectedLetter === null
              ? 'bg-[#008080] text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-teal-100 border border-teal-200'
              }`}
          >
            সব
          </button>

          {availableLetters.map((letter, idx) => (
            <button
              key={idx}
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

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded border border-dashed border-gray-300">
          আপনার অনুসন্ধান অনুযায়ী কোন {displayTitle} পাওয়া যায়নি।
        </div>
      ) : (
        <>
          {/* রেসপন্সিভ গ্রিড */}
          <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-1">
            {currentItems.map((item: any, idx: number) => {
              const titleText = extractFieldText(item.title, "শিরোনামহীন");

              // সিঙ্গেল আইটেমের জন্য ইউআরএল ফরম্যাট নির্ধারণ (যেমন: /item/story/chokh)
              const titleHref = item.slug ? `/item/${item.slug}` : (item.href || "#");

              const bookText = extractFieldText(item.bookTitle || item.book, "—");
              const bookHref = item.bookHref || (item.bookSlug ? `/book/${item.bookSlug}` : "#");

              const authorText = extractFieldText(item.author, "—");
              const authorHref = item.authorHref || (item.authorSlug ? `/author/${item.authorSlug}` : "#");

              return (
                <div key={idx} className="bg-white border border-teal-100 rounded p-2 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-center">

                  {/* ১. ডেস্কটপ ভিউ */}
                  <div className="hidden md:flex items-center flex-wrap gap-x-2 text-base">
                    <Link
                      href={titleHref}
                      className="font-bold text-[#008080] hover:text-[#cc7a00] no-underline transition-colors"
                    >
                      {titleText}
                    </Link>
                    <span className="text-gray-300">|</span>
                    {bookHref !== "#" ? (
                      <Link href={bookHref} className="text-teal-700 hover:text-[#cc7a00] no-underline transition-colors">
                        {bookText}
                      </Link>
                    ) : (
                      <span className="text-gray-600">{bookText}</span>
                    )}
                    <span className="text-gray-300">|</span>
                    {authorHref !== "#" ? (
                      <Link href={authorHref} className="text-gray-600 hover:text-[#cc7a00] no-underline transition-colors">
                        {authorText}
                      </Link>
                    ) : (
                      <span className="text-gray-600">{authorText}</span>
                    )}
                  </div>

                  {/* ২. মোবাইল ভিউ */}
                  <div className="flex md:hidden flex-col space-y-2">
                    <Link
                      href={titleHref}
                      className="text-base font-bold text-[#008080] hover:text-[#cc7a00] transition-colors"
                    >
                      {titleText}
                    </Link>
                    <div className="flex items-center flex-wrap gap-x-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
                      {bookHref !== "#" ? (
                        <Link href={bookHref} className="text-teal-700 hover:text-[#cc7a00] no-underline transition-colors">
                          {bookText}
                        </Link>
                      ) : (
                        <span>{bookText}</span>
                      )}
                      <span className="text-gray-300">|</span>
                      {authorHref !== "#" ? (
                        <Link href={authorHref} className="hover:text-[#cc7a00] no-underline transition-colors">
                          {authorText}
                        </Link>
                      ) : (
                        <span>{authorText}</span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* লোড মোর (Load More) বাটন */}
          {visibleCount < filtered.length && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2.5 bg-[#008080] text-white font-medium text-sm rounded shadow-sm hover:bg-[#006666] transition-colors cursor-pointer"
              >
                আরও {Math.min(itemsPerPage, filtered.length - visibleCount).toLocaleString("bn-BD")} টি দেখুন
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}