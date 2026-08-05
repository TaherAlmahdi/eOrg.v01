"use client";

import type { FC } from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Search, User } from "lucide-react";

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

interface AuthorItem {
  slug: string;
  name: string;
  count: number;
}

interface AuthorListViewProps {
  authors: AuthorItem[];
  isHomePage?: boolean;
  totalAuthorsCount: number;
}

export const AuthorListView: FC<AuthorListViewProps> = ({
  authors,
  isHomePage = false,
  totalAuthorsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("সব");

  // 🔹 ১. বিদ্যমান লেখকদের প্রথম বর্ণ ডাইনামিক্যালি বের করা ও বাংলা বর্ণানুক্রমিকভাবে সাজানো
  const availableLetters = useMemo(() => {
    if (isHomePage) return [];

    const lettersSet = new Set<string>();

    authors.forEach((item) => {
      const firstChar = item.name.trim().charAt(0);
      if (firstChar) {
        lettersSet.add(firstChar);
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, "bn", { sensitivity: "base" })
    );

    return ["সব", ...sortedLetters];
  }, [authors, isHomePage]);

  // 🔹 ২. সার্চ বার ও আদ্যক্ষর ফিল্টারিং লজিক
  const filteredAuthors = useMemo(() => {
    if (isHomePage) return authors;

    return authors.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const firstChar = item.name.trim().charAt(0);
      const matchesLetter = selectedLetter === "সব" || firstChar === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [authors, searchQuery, selectedLetter, isHomePage]);

  return (
    <div className="w-full">
      {/* 🔹 লেখক পেজের জন্য সার্চ বার ও আদ্যক্ষর ফিল্টার বার */}
      {!isHomePage && (
        <div className="mb-6 p-4 bg-white/90 backdrop-blur-md rounded border border-teal-100 shadow-sm space-y-4">



          {/* সার্চ ইনপুট */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 w-5 h-5" />
            <input
              type="text"
              placeholder="লেখকের নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-teal-200 rounded focus:outline-none focus:ring-2 focus:ring-[#008080] font-tarunima text-sm bg-teal-50/30 text-gray-800"
            />
          </div>

          {/* আদ্যক্ষর কুইক ফিল্টার বার */}
          {availableLetters.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-gray-100 font-tarunima">
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2.5 py-1 text-xs md:text-sm font-semibold rounded transition-colors ${
                    selectedLetter === letter
                      ? "bg-[#008080] text-white shadow-xs"
                      : "bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-[#008080]"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔹 লেখক তালিকা গ্রিড */}
      {filteredAuthors.length === 0 ? (
        <div className="text-center p-8 bg-white/80 rounded text-gray-600 font-tarunima">
          কোনো লেখকের তথ্য পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-2">
          {filteredAuthors.map(({ slug, name, count }) => (
            <Link
              key={slug}
              href={`/author/${slug}`}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded bg-white/90 text-[#008080] border border-teal-100 shadow-sm transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 group cursor-pointer w-full"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-white transition-colors duration-300 shrink-0">
                  <User className="w-5 h-5 shrink-0" />
                </div>
                <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-base font-semibold leading-snug font-tarunima truncate transition-colors">
                  {name}
                </h3>
              </div>

              <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-2 py-1 rounded text-xs font-semibold">
                <BookOpen size={13} className="shrink-0" />
                <span>{toBengaliNumber(count)} টি</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 🔹 হোমপেজের জন্য "সকল লেখক দেখুন" বাটন */}
      {isHomePage && totalAuthorsCount > authors.length && (
        <div className="text-center mt-6 mb-4 font-tarunima">
          <Link
            href="/authors"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-[#008080] text-white font-semibold text-sm hover:bg-teal-700 transition-colors shadow-sm"
          >
            সকল লেখক দেখুন ({toBengaliNumber(totalAuthorsCount)} জন) →
          </Link>
        </div>
      )}
    </div>
  );
};