// app/components/ItemListView.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export interface ItemData {
  label: string;
  slug: string;
  count: number;
}

interface ItemListViewProps {
  items: ItemData[];
  isHomePage?: boolean;
  limit?: number;
  initialPageSize?: number;
}

export default function ItemListView({
  items,
  isHomePage = false,
  limit,
  initialPageSize = 100,
}: ItemListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("সব");
  const [visibleCount, setVisibleCount] = useState<number>(
    isHomePage && limit ? limit : initialPageSize
  );

  // 🟢 ১. পাওয়া যাওয়া আইটেমগুলোর প্রথম বর্ণ ডাইনামিকালি বের করা
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    items.forEach((item) => {
      if (item.label) {
        const firstChar = item.label.trim().charAt(0);
        if (firstChar) letters.add(firstChar);
      }
    });

    return Array.from(letters).sort((a, b) => a.localeCompare(b, "bn"));
  }, [items]);

  // 🟢 ২. সার্চ ও আদ্যক্ষর ফিল্টারিং
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.label
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());

      const firstChar = item.label.trim().charAt(0);
      const matchesLetter =
        selectedLetter === "সব" || firstChar === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [items, searchTerm, selectedLetter]);

  // হোম পেজ হলে লিমিট অনুযায়ী, অন্যথায় লোড মোড় পেজিনেশন
  const displayedItems = isHomePage && limit
    ? filteredItems.slice(0, limit)
    : filteredItems.slice(0, visibleCount);

  const hasMore = !isHomePage && visibleCount < filteredItems.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + initialPageSize);
  };

  return (
    <section className="w-full py-4 space-y-6">
      {/* 🟢 সার্চ ও আদ্যক্ষর ফিল্টার বার (শুধুমাত্র আইটেম পেজে বা চাইলে সর্বত্র) */}
      {!isHomePage && (
        <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          {/* সার্চ বক্স */}
          <div className="max-w-md w-full">
            <input
              type="text"
              placeholder="আইটেমের নাম খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* আদ্যক্ষর ফিল্টার বাটনসমূহ */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setSelectedLetter("সব")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedLetter === "সব"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              সব
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedLetter === letter
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🟢 আইটেম গ্রিড তালিকা */}
      {displayedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayedItems.map((item) => (
            <Link
              key={item.slug}
              href={`/items/${item.slug}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-sm transition-all group"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                {item.label}
              </span>
              <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                ({item.count})
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
          কোনো আইটেম পাওয়া যায়নি।
        </div>
      )}

      {/* 🟢 লোড মোর বাটন */}
      {!isHomePage && hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-full transition-all cursor-pointer"
          >
            আরও লোড করুন ({filteredItems.length - visibleCount}টি বাকি)
          </button>
        </div>
      )}
    </section>
  );
}