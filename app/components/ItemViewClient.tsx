'use client';
import { useState, useMemo } from "react";
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

  // ১. ইউনিক আদ্যক্ষর (Alphabet) তালিকা তৈরি যা দিয়ে বর্ণানুক্রমিক ফিল্টার হবে
  const availableLetters = useMemo(() => {
    const lettersSet = new Set<string>();
    initialItems.forEach((item: any) => {
      const title = extractFieldText(item.title);
      if (title && title !== "—" && title !== "শিরোনামহীন") {
        const firstChar = title.trim().charAt(0);
        // ইংরেজি হলে ক্যাপিটাল করা, বাংলা হলে অপরিবর্তিত রাখা
        const formattedChar = /^[a-zA-Z]$/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
        lettersSet.add(formattedChar);
      }
    });
    // বর্ণগুলোকে ক্রমানুসারে সাজানো
    return Array.from(lettersSet).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [initialItems]);

  // ২. সার্চ ও বর্ণানুক্রমিক ফিল্টারিং লজিক
  const filtered = useMemo(() => {
    return initialItems.filter((item: any) => {
      const titleText = extractFieldText(item.title);
      const bookText = extractFieldText(item.bookTitle || item.book);
      const authorText = extractFieldText(item.author);

      // বর্ণ ফিল্টার চেক
      if (selectedLetter) {
        const firstChar = titleText.trim().charAt(0);
        const formattedChar = /^[a-zA-Z]$/.test(firstChar) ? firstChar.toUpperCase() : firstChar;
        if (formattedChar !== selectedLetter) return false;
      }

      // সার্চ কুয়েরি চেক (স্মার্ট নরমালাইজেশনসহ)
      const query = normalizeBengali(search);
      if (!query) return true;

      const title = normalizeBengali(titleText);
      const book = normalizeBengali(bookText);
      const author = normalizeBengali(authorText);

      return title.includes(query) || book.includes(query) || author.includes(query);
    });
  }, [initialItems, search, selectedLetter]);

  return (
    <main className="w-full px-2 md:px-2 py-3 font-tarunima space-y-3">
      
      {/* ব্রেডক্রাম সেকশন (টাইটেলের উপরে) */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-gray-500 space-x-1.5 pb-1">
        <Link href="/" className="flex items-center hover:text-[#008080] transition-colors">
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>প্রচ্ছদ</span>
        </Link>
        <ChevronLeft className="w-3 h-3 text-gray-400 rtl:rotate-180" />
        <span className="text-gray-800 font-medium">{displayTitle}</span>
      </nav>

      {/* হেডার সেকশন: বামে টাইটেল ও সংখ্যা, ডানে সার্চবার */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-2 gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-950">
            প্রকরণ : <span className="text-[#008080]">{displayTitle}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {displayTitle} প্রকরণে সর্বমোট {filtered.length.toLocaleString("bn-BD")} টি {displayTitle} রয়েছে!
          </p>
        </div>

        {/* সার্চবার (ডেস্কটপে ডানে, মোবাইলে হেডারের নিচে) */}
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

      {/* ৩. বর্ণানুক্রমিক ফিল্টার বার (Automatic Alphabetical Filter) */}
      {availableLetters.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap bg-teal-50/50 p-2 rounded border border-teal-100">        
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
              selectedLetter === null 
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
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                selectedLetter === letter 
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
        /* রেসপন্সিভ গ্রিড: মোবাইলে ১ কলাম, ল্যাপটপে ২ কলাম, বড় স্ক্রিনে (২০ ইঞ্চি+) ৩ কলাম */
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2">
          {filtered.map((item: any, idx: number) => {
            const titleText = extractFieldText(item.title, "শিরোনামহীন");
            const titleHref = item.href || "#";

            const bookText = extractFieldText(item.bookTitle || item.book, "—");
            const bookHref = item.bookHref || (item.bookSlug ? `/book/${item.bookSlug}` : "#");

            const authorText = extractFieldText(item.author, "—");
            const authorHref = item.authorHref || (item.authorSlug ? `/author/${item.authorSlug}` : "#");

            return (
              <div key={idx} className="bg-white border border-teal-100 rounded p-2 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-center">
                
                {/* ১. ডেস্কটপ ভিউ: এক লাইনে (টাইটেল | বুক টাইটেল | অথর নেম) */}
                <div className="hidden md:flex items-center flex-wrap gap-x-2 text-sm">
                  <Link
                    href={titleHref}
                    className="font-bold text-[#008080] hover:text-[#cc7a00] hover:underline transition-colors"
                  >
                    {titleText}
                  </Link>
                  <span className="text-gray-300">|</span>
                  {bookHref !== "#" ? (
                    <Link href={bookHref} className="text-teal-700 hover:underline">
                      {bookText}
                    </Link>
                  ) : (
                    <span className="text-gray-600">{bookText}</span>
                  )}
                  <span className="text-gray-300">|</span>
                  {authorHref !== "#" ? (
                    <Link href={authorHref} className="text-gray-600 hover:underline">
                      {authorText}
                    </Link>
                  ) : (
                    <span className="text-gray-600">{authorText}</span>
                  )}
                </div>

                {/* ২. মোবাইল ভিউ: উপরে টাইটেল, নিচে বুক টাইটেল ও অথর নেম ( | সেপারেটর সহ) */}
                <div className="flex md:hidden flex-col space-y-2">
                  <Link
                    href={titleHref}
                    className="text-base font-bold text-[#008080] hover:text-[#cc7a00] transition-colors"
                  >
                    {titleText}
                  </Link>
                  <div className="flex items-center flex-wrap gap-x-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
                    {bookHref !== "#" ? (
                      <Link href={bookHref} className="text-teal-700 hover:underline">
                        {bookText}
                      </Link>
                    ) : (
                      <span>{bookText}</span>
                    )}
                    <span className="text-gray-300">|</span>
                    {authorHref !== "#" ? (
                      <Link href={authorHref} className="hover:underline">
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
      )}
    </main>
  );
}