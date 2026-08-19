// app/items/ItemArchiveClient.tsx
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';

// আপনার প্রজেক্টের রেজিস্ট্রি ফাইলে যদি স্লগ বা টাইপ ম্যাপ করা থাকে
// উদাহরণস্বরূপ:
// import { ITEM_SLUG_REGISTRY } from '@/registry/itemRegistry';

function safeExtractString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.name || val.title || val.label || val.name_bn || '';
  }
  return String(val);
}

// রেজিস্ট্রি বা অবজেক্ট থেকে সেফ স্লাগ ও লিংক বের করার ফাংশন
function safeExtractLink(val: any, fallbackPrefix: string): string {
  if (!val) return '#';
  
  // ১. যদি সরাসরি অবজেক্ট থাকে এবং তাতে slug/link দেওয়া থাকে
  if (typeof val === 'object') {
    if (val.link) return val.link;
    if (val.slug) return `${fallbackPrefix}/${val.slug}`;
  }

  const str = safeExtractString(val).trim();
  if (!str) return '#';

  // ২. যদি রেজিস্ট্রি অবজেক্ট/ডিকশনারি থাকে, তবে সেখান থেকে স্লাগ ম্যাচ করানো
  /*
  if (ITEM_SLUG_REGISTRY && ITEM_SLUG_REGISTRY[str]) {
    return `${fallbackPrefix}/${ITEM_SLUG_REGISTRY[str]}`;
  }
  */

  // ৩. ফলব্যাক হিসেবে সেফ ইউআরএল
  return `${fallbackPrefix}/${encodeURIComponent(str)}`;
}

export interface ItemEntry {
  title: string;
  href: string;
  item?: any;       // যেমন: { name: "কবিতা", slug: "poem" } বা "কবিতা"
  bookTitle?: any;  // যেমন: { name: "অগ্নিবীণা", slug: "agnibina" }
  author?: any;     // যেমন: { name: "কাজী নজরুল ইসলাম", slug: "kazi-nazrul-islam" }
}

export default function ItemArchiveClient({ allItems = [] }: { allItems: ItemEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [openMobileIndex, setOpenMobileIndex] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return allItems.filter((entry) => {
      const title = safeExtractString(entry.title);
      const itemTypeName = safeExtractString(entry.item);
      const bookTitle = safeExtractString(entry.bookTitle);
      const author = safeExtractString(entry.author);

      const matchesSearch =
        !searchTerm ||
        [title, itemTypeName, bookTitle, author].some((text) =>
          text.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesLetter = !selectedLetter || title.startsWith(selectedLetter);

      return matchesSearch && matchesLetter;
    });
  }, [allItems, searchTerm, selectedLetter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, ItemEntry[]> = {};
    filteredItems.forEach((entry) => {
      const title = safeExtractString(entry.title);
      const firstLetter = title.charAt(0) || '#';
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(entry);
    });

    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b, 'bn'))
      .map((letter) => ({ letter, items: groups[letter] }));
  }, [filteredItems]);

  const availableLetters = useMemo(() => {
    const letters = new Set(
      allItems.map((i) => safeExtractString(i.title).charAt(0)).filter(Boolean)
    );
    return Array.from(letters).sort((a, b) => a.localeCompare(b, 'bn'));
  }, [allItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">আইটেম আর্কাইভ</h1>

      {/* সার্চ ও ফিল্টার */}
      <div className="space-y-4 mb-8 bg-white p-4 rounded-xl border shadow-sm">
        <input
          type="text"
          placeholder="শিরোনাম, ধরণ, গ্রন্থ বা লেখক দিয়ে খুঁজুন..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-1.5 pt-2 border-t text-sm">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-3 py-1 rounded-md transition ${
              selectedLetter === null
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            সব
          </button>
          {availableLetters.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter === selectedLetter ? null : letter)}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedLetter === letter
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* কন্টেন্ট লিস্ট */}
      {groupedItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {groupedItems.map((group) => (
            <div key={group.letter} className="space-y-3">
              <div className="text-2xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1 w-fit min-w-[2rem]">
                {group.letter}
              </div>

              <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 font-semibold text-xs text-gray-600 rounded-md">
                <span className="col-span-4">শিরোনাম</span>
                <span className="col-span-2">ধরণ</span>
                <span className="col-span-3">গ্রন্থনাম</span>
                <span className="col-span-3">লেখক</span>
              </div>

              <div className="divide-y border rounded-lg bg-white overflow-hidden shadow-sm">
                {group.items.map((entry, idx) => {
                  const title = safeExtractString(entry.title);
                  const itemTypeName = safeExtractString(entry.item);
                  const itemLink = safeExtractLink(entry.item, '/items');
                  const bookTitle = safeExtractString(entry.bookTitle);
                  const bookLink = safeExtractLink(entry.bookTitle, '/books');
                  const author = safeExtractString(entry.author);
                  const authorLink = safeExtractLink(entry.author, '/authors');
                  const globalIdx = `${group.letter}-${idx}`;

                  return (
                    <div key={globalIdx} className="hover:bg-gray-50 transition">
                      {/* ডেক্সটপ ভিউ */}
                      <div className="hidden md:grid grid-cols-12 gap-2 p-3 text-sm items-center">
                        <Link
                          href={entry.href || '#'}
                          className="col-span-4 font-medium text-blue-600 hover:underline truncate"
                        >
                          {title || 'শিরোনামহীন'}
                        </Link>
                        
                        <div className="col-span-2 truncate">
                          {itemTypeName ? (
                            <Link href={itemLink} className="text-gray-600 hover:text-blue-600">
                              {itemTypeName}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>

                        <div className="col-span-3 truncate">
                          {bookTitle ? (
                            <Link href={bookLink} className="text-gray-600 hover:text-blue-600">
                              {bookTitle}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>

                        <div className="col-span-3 truncate">
                          {author ? (
                            <Link href={authorLink} className="text-gray-600 hover:text-blue-600">
                              {author}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>

                      {/* মোবাইল ভিউ */}
                      <div className="md:hidden">
                        <div className="flex justify-between items-center p-3">
                          <Link
                            href={entry.href || '#'}
                            className="font-medium text-blue-600 hover:underline flex-1 pr-2"
                          >
                            {title || 'শিরোনামহীন'}
                          </Link>
                          <button
                            onClick={() =>
                              setOpenMobileIndex(
                                openMobileIndex === globalIdx ? null : globalIdx
                              )
                            }
                            className="p-1 text-gray-400 hover:text-gray-700"
                          >
                            <span
                              className={`inline-block transition-transform ${
                                openMobileIndex === globalIdx ? 'rotate-90' : ''
                              }`}
                            >
                              ❯
                            </span>
                          </button>
                        </div>

                        {openMobileIndex === globalIdx && (
                          <div className="px-3 pb-3 pt-1 text-xs text-gray-500 bg-gray-50 border-t flex flex-wrap gap-x-3 gap-y-1">
                            {itemTypeName && (
                              <span>
                                ধরণ:{' '}
                                <Link
                                  href={itemLink}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {itemTypeName}
                                </Link>
                              </span>
                            )}
                            {bookTitle && (
                              <>
                                <span>•</span>
                                <span>
                                  গ্রন্থ:{' '}
                                  <Link
                                    href={bookLink}
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    {bookTitle}
                                  </Link>
                                </span>
                              </>
                            )}
                            {author && (
                              <>
                                <span>•</span>
                                <span>
                                  লেখক:{' '}
                                  <Link
                                    href={authorLink}
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    {author}
                                  </Link>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 bg-white rounded-lg border">
          কোনো আইটেম পাওয়া যায়নি।
        </div>
      )}
    </div>
  );
}