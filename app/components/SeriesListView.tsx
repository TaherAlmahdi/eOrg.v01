"use client";

import type { FC } from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, Search, BookMarked, Bookmark, Feather, Scroll, Layers,
  FileText, Languages, Laugh, BookText, Compass, History, GraduationCap,
  Music, Flame, MoonStar, Cross, Sun, Flower2
} from "lucide-react";

// 🔹 বাংলা বর্ণ ও স্পেস নরমালাইজ করার হেল্পার ফাংশন
const normalizeBengaliText = (text: string): string => {
  if (!text) return "";
  return text
    .normalize("NFC") // ইউনিকোড নরমাল এনকোডিং
    .toLowerCase()
    // সমতুল্য বাংলা বর্ণ ও নুকতা সামঞ্জস্যকরণ
    .replace(/য়/g, "য")
    .replace(/ড়/g, "র")
    .replace(/ঢ়/g, "র")
    .replace(/ব়/g, "র")
    .replace(/়/g, "") // যেকোনো অবশিষ্ট নুকতা রিমুভ
    .replace(/[\s\-_]+/g, ""); // স্পেস, হাইফেন ও আন্ডারস্কোর রিমুভ (যেমন: হিমু সমগ্র -> হিমুসমগ্র)
};

// ১. Lucide icons mapping
const SERIES_ICONS: Record<string, FC<{ className?: string }>> = {
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
const getSeriesIcon = (slug: string, rawText: string): FC<{ className?: string }> => {
  const cleanSlug = slug.toLowerCase().trim();
  const cleanText = rawText.toLowerCase().trim();

  if (SERIES_ICONS[cleanSlug]) return SERIES_ICONS[cleanSlug];
  if (SERIES_ICONS[cleanText]) return SERIES_ICONS[cleanText];

  if (cleanSlug.includes("islam") || cleanText.includes("ইসলাম")) return SERIES_ICONS.islam;
  if (cleanSlug.includes("hindu") || cleanText.includes("হিন্দু")) return SERIES_ICONS.hinduism;
  if (cleanSlug.includes("buddh") || cleanText.includes("বৌদ্ধ")) return SERIES_ICONS.buddhism;
  if (cleanSlug.includes("christ") || cleanText.includes("খ্রিষ্ট")) return SERIES_ICONS.christianity;
  if (cleanSlug.includes("religi") || cleanText.includes("ধর্ম")) return SERIES_ICONS.religious;

  if (cleanSlug.includes("novel") || cleanText.includes("উপন্যাস")) return SERIES_ICONS.novel;
  if (cleanSlug.includes("poem") || cleanText.includes("কবিতা")) return SERIES_ICONS.poetry;
  if (cleanSlug.includes("essay") || cleanText.includes("প্রবন্ধ")) return SERIES_ICONS.essay;
  if (cleanSlug.includes("story") || cleanText.includes("গল্প")) return SERIES_ICONS.story;

  return ({ className }) => <BookText className={className} />;
};

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

export interface SeriesItem {
  slug: string;
  label: string;
  rawSeries: string;
  count: number;
}

interface SeriesListViewProps {
  seriesList?: SeriesItem[];
  isHomePage?: boolean;
  totalSeriesCount?: number;
}

export const SeriesListView: FC<SeriesListViewProps> = ({
  seriesList = [],
  isHomePage = false,
  totalSeriesCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("সব");

  // 🔹 ১. ফিল্টারিং ও বর্ণানুক্রমে সাজানো
  const validSeriesList = useMemo(() => {
    const filtered = seriesList.filter((item) => {
      if (!item.label || !item.slug) return false;
      const cleanLabel = item.label.trim().toLowerCase();
      const cleanSlug = item.slug.trim().toLowerCase();

      return !(
        cleanLabel === "" ||
        cleanLabel === "অন্যান্য" ||
        cleanLabel === "others" ||
        cleanSlug === "others" ||
        cleanSlug === "other"
      );
    });

    if (isHomePage) {
      return filtered.slice(0, 20);
    } else {
      return [...filtered].sort((a, b) =>
        a.label.trim().localeCompare(b.label.trim(), "bn", { sensitivity: "base" })
      );
    }
  }, [seriesList, isHomePage]);

  // 🔹 ২. প্রথমাংশ ডাইনামিক্যালি বের করা
  const availableLetters = useMemo(() => {
    if (isHomePage) return [];

    const lettersSet = new Set<string>();

    validSeriesList.forEach((item) => {
      const firstChar = item.label.trim().charAt(0).normalize("NFC");
      if (firstChar) {
        lettersSet.add(firstChar);
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, "bn", { sensitivity: "base" })
    );

    return ["সব", ...sortedLetters];
  }, [validSeriesList, isHomePage]);

  // 🔹 ৩. সার্চ ও আদ্যক্ষর ফিল্টারিং (সমতুল্য বাংলা বর্ণ ও স্পেস সমস্যার সমাধান সহ)
  const filteredSeries = useMemo(() => {
    if (isHomePage) return validSeriesList;

    const normalizedQuery = normalizeBengaliText(searchQuery);

    return validSeriesList.filter((item) => {
      const normalizedLabel = normalizeBengaliText(item.label);
      const matchesSearch = normalizedLabel.includes(normalizedQuery);

      const firstChar = item.label.trim().charAt(0).normalize("NFC");
      const matchesLetter = selectedLetter === "সব" || firstChar === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [validSeriesList, searchQuery, selectedLetter, isHomePage]);

  const displayTotalCount = totalSeriesCount ?? validSeriesList.length;

  return (
    <div className="w-full font-tarunima">
      {!isHomePage && (
        <div className="mb-3 space-y-3 bg-white/95 backdrop-blur-md shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            {/* বামপাশে ডাইনামিক পেজ টাইটেল */}
            <div className="rounded bg-teal-50/90 text-[#008080] border border-teal-200 shadow-xs backdrop-blur-md self-start md:self-auto">
              <div className="p-2.5 inline-flex items-center gap-2">
                <Layers size={22} className="shrink-0 animate-pulse text-[#008080]" />
                <h1 className="text-xl md:text-2xl font-bold text-gray-950 leading-none">
                  <span className="text-[#008080]">সিরিজ</span> <span className="text-[#cc7a00]">নির্ঘণ্ট</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {displayTotalCount > 0 && (
                  <span className="w-full text-xs md:text-sm font-normal text-teal-700 bg-teal-100/70 px-2 py-1 border-t border-teal-200 inline-block">
                    সিরিজ সংখ্যা সর্বমোট {toBengaliNumber(displayTotalCount)}টি
                  </span>
                )}
              </p>
            </div>

            {/* ডানপাশে সার্চবার */}
            <div className="relative w-full md:w-80 shrink-0 px-2">
              <Search className="absolute w-4 h-4 text-teal-600 -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="সিরিজের নাম দিয়ে খুঁজুন..."
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

      {/* সিরিজ তালিকা */}
      {filteredSeries.length === 0 ? (
        <div className="p-8 text-center text-gray-500 rounded bg-white border border-dashed border-gray-300">
          কোনো সিরিজ পাওয়া যায়নি।
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {filteredSeries.map(({ slug, label, rawSeries, count }, index) => {
            const IconComponent = getSeriesIcon(slug, rawSeries);

            return (
              <Link
                key={`${slug}-${index}`}
                href={`/series/${slug}`}
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
                  <BookOpen size={14} className="shrink-0" />
                  <span>{toBengaliNumber(count)} টি</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};