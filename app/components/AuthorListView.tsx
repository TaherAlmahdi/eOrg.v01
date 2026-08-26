"use client";

import type { FC } from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Search, User, Users } from "lucide-react";
import { normalizeKey } from "@/app/lib/normalizeHelpers";

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

export interface AuthorItem {
  slug: string;
  name: string;
  count: number;
}

interface AuthorListViewProps {
  authors?: AuthorItem[];
  isHomePage?: boolean;
  totalAuthorsCount?: number;
}

export const AuthorListView: FC<AuthorListViewProps> = ({
  authors = [],
  isHomePage = false,
  totalAuthorsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("সব");

  // 🔹 ১. ফিল্টারিং ও বর্ণানুক্রমে সাজানো
  const validAuthorsList = useMemo(() => {
    const filtered = authors.filter((item) => {
      if (!item.name || !item.slug) return false;
      const cleanName = item.name.trim().toLowerCase();
      const cleanSlug = item.slug.trim().toLowerCase();

      return !(
        cleanName === "" ||
        cleanName === "অন্যান্য" ||
        cleanName === "others" ||
        cleanSlug === "others" ||
        cleanSlug === "other"
      );
    });

    if (isHomePage) {
      return filtered.slice(0, 20);
    } else {
      return [...filtered].sort((a, b) =>
        a.name.trim().localeCompare(b.name.trim(), "bn", { sensitivity: "base" })
      );
    }
  }, [authors, isHomePage]);

  // 🔹 ২. প্রথমাংশ (আদ্যক্ষর) ডাইনামিক্যালি বের করা (অতিরিক্ত স্পেস বা চিহ্ন ট্রিম করে)
  const availableLetters = useMemo(() => {
    if (isHomePage) return [];

    const lettersSet = new Set<string>();

    validAuthorsList.forEach((item) => {
      const cleanName = item.name.trim().replace(/^[\s\-_–—\.,'\/\(\)]+/, "");
      const firstChar = cleanName.charAt(0).normalize("NFC");
      if (firstChar) {
        lettersSet.add(firstChar);
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, "bn", { sensitivity: "base" })
    );

    return ["সব", ...sortedLetters];
  }, [validAuthorsList, isHomePage]);

  // 🔹 ৩. সার্চ ও আদ্যক্ষর ফিল্টারিং (স্পেস, হাইফেন ও চিহ্নহীন নরমালাইজড টেক্সট ম্যাচিং)
  const filteredAuthors = useMemo(() => {
    if (isHomePage) return validAuthorsList;

    const normalizedQuery = normalizeKey(searchQuery);

    return validAuthorsList.filter((item) => {
      const normalizedName = normalizeKey(item.name);
      const matchesSearch = normalizedName.includes(normalizedQuery);

      const cleanName = item.name.trim().replace(/^[\s\-_–—\.,'\/\(\)]+/, "");
      const firstChar = cleanName.charAt(0).normalize("NFC");
      const matchesLetter = selectedLetter === "সব" || firstChar === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [validAuthorsList, searchQuery, selectedLetter, isHomePage]);

  const displayTotalCount = totalAuthorsCount ?? validAuthorsList.length;

  return (
    <div className="w-full font-tarunima">
      {!isHomePage && (
        <div className="mb-3 space-y-3 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            {/* বামপাশে ডাইনামিক পেজ টাইটেল */}
            <div className="rounded bg-teal-50/90 text-[#008080] border border-teal-200 shadow-xs backdrop-blur-md self-start md:self-auto">
              <div className="p-2.5 inline-flex items-center gap-2">
                <Users size={22} className="shrink-0 animate-pulse text-[#008080]" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-950 leading-none">
                  <span className="text-[#008080]">লেখক</span> <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {displayTotalCount > 0 && (
                  <span className="w-full text-xs md:text-sm font-normal text-teal-700 bg-teal-100/70 px-2 py-1 border-t border-teal-200 inline-block">
                    লেখক সংখ্যা সর্বমোট {toBengaliNumber(displayTotalCount)} জন
                  </span>
                )}
              </p>
            </div>

            {/* ডানপাশে সার্চবার */}
            <div className="relative w-full md:w-80 shrink-0 px-2">
              <Search className="absolute w-4 h-4 text-teal-600 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="লেখকের নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-teal-200 rounded focus:outline-none focus:ring-1 focus:ring-[#008080] text-sm bg-teal-50/30 text-gray-800 shadow-xs placeholder-gray-400"
              />
            </div>

          </div>

          {/* নিচে: সেন্টারে আদ্যক্ষর ফিল্টার বার */}
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
      )}

      {/* লেখক তালিকা */}
      {filteredAuthors.length === 0 ? (
        <div className="p-8 text-center text-gray-500 rounded bg-white border border-dashed border-gray-300">
          কোনো লেখকের তথ্য পাওয়া যায়নি।
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {filteredAuthors.map(({ slug, name, count }, index) => (
            <Link
              key={`${slug}-${index}`}
              href={`/author/${slug}`}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded bg-white text-[#008080] border border-teal-100 shadow-xs transition-all duration-200 hover:bg-teal-50/50 hover:shadow-md hover:border-teal-300 shrink-0 grow basis-full sm:basis-[calc(50%-0.35rem)] lg:basis-[calc(33.333%-0.45rem)] xl:basis-[calc(25%-0.5rem)] 2xl:basis-[calc(20%-0.5rem)] max-w-full group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-white transition-colors duration-200 shrink-0">
                  <User className="w-5 h-5 shrink-0" />
                </div>
                <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-sm md:text-base font-semibold leading-snug truncate transition-colors">
                  {name}
                </h3>
              </div>

              <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-2 py-0.5 rounded text-xs font-semibold">
                <BookOpen size={14} className="shrink-0" />
                <span>{toBengaliNumber(count)} টি</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};