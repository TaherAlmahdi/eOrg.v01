"use client";

import type { FC } from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, Search, BookMarked, Bookmark, Feather, Scroll, Layers,
  FileText, Languages, Laugh, BookText, Compass, History, GraduationCap,
  Music, Flame, MoonStar, Cross, Sun, Flower2
} from "lucide-react";

// বাংলা ও ইউনিকোড নরমালাইজেশন (স্পেস ও য়, ড়, ঢ়, র্/র/ব় সমাধানসহ)
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
    .replace(/\s+/g, '') // স্পেস বাদ দেওয়া যাতে 'সাহিত্য সমালোচনা' এবং 'সাহিত্যসমালোচনা' এক হয়ে যায়
    .trim();
};

// ১. Lucide icons mapping
const GENRE_ICONS: Record<string, FC<{ className?: string }>> = {
  novel: ({ className }) => <BookMarked className={className} />,
  novella: ({ className }) => <Bookmark className={className} />,
  poetry: ({ className }) => <Feather className={className} />,
  essay: ({ className }) => <Scroll className={className} />,
  story: ({ className }) => <BookOpen className={className} />,
  drama: ({ className }) => <Layers className={className} />,
  research: ({ className }) => <Search className={className} />,
  article: ({ className }) => <FileText className={className} />,
  translation: ({ className }) => <Languages className={className} />,
  humor: ({ className }) => <Laugh className={className} />,
  classic: ({ className }) => <BookText className={className} />,
  folklore: ({ className }) => <Compass className={className} />,
  history: ({ className }) => <History className={className} />,
  philosophy: ({ className }) => <GraduationCap className={className} />,
  song: ({ className }) => <Music className={className} />,
  speech: ({ className }) => <FileText className={className} />,
  religious: ({ className }) => <Flame className={className} />,
  islam: ({ className }) => <MoonStar className={className} />,
  hinduism: ({ className }) => <Sun className={className} />,
  buddhism: ({ className }) => <Flower2 className={className} />,
  christianity: ({ className }) => <Cross className={className} />,
};

// ২. স্মার্ট আইকন ডিটেক্টর
const getItemIcon = (slug: string, rawText: string): FC<{ className?: string }> => {
  const cleanSlug = normalizeBengali(slug);
  const cleanText = normalizeBengali(rawText);

  if (GENRE_ICONS[cleanSlug]) return GENRE_ICONS[cleanSlug];
  if (GENRE_ICONS[cleanText]) return GENRE_ICONS[cleanText];

  if (cleanSlug.includes("islam") || cleanText.includes("ইসলাম")) return GENRE_ICONS.islam;
  if (cleanSlug.includes("hindu") || cleanText.includes("হিন্দু")) return GENRE_ICONS.hinduism;
  if (cleanSlug.includes("buddh") || cleanText.includes("বৌদ্ধ")) return GENRE_ICONS.buddhism;
  if (cleanSlug.includes("christ") || cleanText.includes("খ্রিষ্ট")) return GENRE_ICONS.christianity;
  if (cleanSlug.includes("religi") || cleanText.includes("ধর্ম")) return GENRE_ICONS.religious;

  if (cleanSlug.includes("novel") || cleanText.includes("উপন্যাস")) return GENRE_ICONS.novel;
  if (cleanSlug.includes("poem") || cleanText.includes("কবিতা")) return GENRE_ICONS.poetry;
  if (cleanSlug.includes("essay") || cleanText.includes("প্রবন্ধ")) return GENRE_ICONS.essay;
  if (cleanSlug.includes("story") || cleanText.includes("গল্প")) return GENRE_ICONS.story;

  return ({ className }) => <BookText className={className} />;
};

// ৩. বাংলা ও ইংরেজি অক্ষরের জন্য ক্লিন স্লাগ হেল্পার
const generateSlugFallback = (slug: string, label: string): string => {
  if (slug && slug.trim() !== "") {
    return slug.trim();
  }
  return label
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0980-\u09FF\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

export interface ItemData {
  slug: string;
  label: string;
  rawGenre?: string;
  count: number;
}

interface ItemListViewProps {
  items: ItemData[];
  isHomePage?: boolean;
  limit?: number;
  totalItemsCount?: number;
  slug?: string;
  slugsArray?: string[];
}

export default function ItemListView({
  items = [],
  isHomePage = false,
}: ItemListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("সব");

  // ৪. বর্ণ তালিকা তৈরি (ইউনিকোড ফিক্স সহ)
  const availableLetters = useMemo(() => {
    if (isHomePage) return [];

    const lettersSet = new Set<string>();

    items.forEach((item) => {
      const normalizedLabel = (item.label || "").normalize('NFC');
      const firstChar = normalizedLabel.trim().charAt(0);
      if (firstChar) {
        lettersSet.add(firstChar);
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, "bn", { sensitivity: "base" })
    );

    return ["সব", ...sortedLetters];
  }, [items, isHomePage]);

  // ৫. সার্চ ও বর্ণানুক্রমিক ফিল্টারিং
  const filteredItems = useMemo(() => {
    if (isHomePage) return items;

    const normalizedQuery = normalizeBengali(searchQuery);

    return items.filter((item) => {
      const normalizedLabel = normalizeBengali(item.label);
      const matchesSearch = !normalizedQuery || normalizedLabel.includes(normalizedQuery);

      const firstChar = (item.label || "").normalize('NFC').trim().charAt(0);
      const matchesLetter = selectedLetter === "সব" || firstChar === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [items, searchQuery, selectedLetter, isHomePage]);

  return (
    <div className="w-full px-0 font-tarunima">
      {!isHomePage && (
        <div className="p-3 md:p-4 mb-3 space-y-3 border border-teal-100 rounded bg-white/95 backdrop-blur-md shadow-xs">
          
          {/* হেডার ও সার্চবার সেকশন */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* বামে: হেডার ও সাবটাইটেল/ট্যাগলাইন */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-950">
                প্রকরণ <span className="text-[#008080]">সম্ভার</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                সর্বমোট {toBengaliNumber(filteredItems.length)}টি প্রকরণ পাওয়া গেছে
              </p>
            </div>

            {/* ডানে: লাইভ সার্চবার */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute w-4 h-4 text-teal-600 -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="প্রকরণ খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-teal-200 rounded focus:outline-none focus:ring-1 focus:ring-[#008080] text-sm bg-teal-50/30 text-gray-800 shadow-xs placeholder-gray-400"
              />
            </div>
          </div>

          {/* নিচে: বর্ণানুক্রমিক ফিল্টার বার (সেন্টার অ্যালাইন করা) */}
          {availableLetters.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1 pt-2.5 border-t border-teal-50">
              {availableLetters.map((letter) => (
                <button
                  type="button"
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2 py-1 text-xs md:text-sm font-semibold rounded transition-colors cursor-pointer ${
                    selectedLetter === letter
                      ? "bg-[#008080] text-white shadow-xs"
                      : "bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-[#008080] border border-transparent hover:border-teal-200"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* আইটেম কার্ড গ্রিড */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center text-gray-500 rounded bg-white border border-dashed border-gray-300">
          কোন প্রকরণ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 p-0">
          {filteredItems.map(({ slug, label, rawGenre, count }) => {
            const IconComponent = getItemIcon(slug, rawGenre || label);
            const resolvedSlug = generateSlugFallback(slug, label);

            return (
              <Link
                key={resolvedSlug}
                href={`/items/${resolvedSlug}`}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded bg-white text-[#008080] border border-teal-100 shadow-xs transition-all duration-200 hover:bg-teal-50/50 hover:shadow-md hover:border-teal-300 shrink-0 grow basis-full sm:basis-[calc(50%-0.35rem)] lg:basis-[calc(33.333%-0.45rem)] xl:basis-[calc(25%-0.5rem)] 2xl:basis-[calc(20%-0.5rem)] max-w-full group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-white transition-colors duration-200 shrink-0">
                    <IconComponent className="w-5 h-5 shrink-0" />
                  </div>
                  <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-sm md:text-base font-semibold leading-snug truncate transition-colors">
                    {label}
                  </h3>
                </div>

                <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-2 py-0.5 rounded text-xs font-semibold">
                  <BookOpen size={13} className="shrink-0" />
                  <span>{toBengaliNumber(count)} টি</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}