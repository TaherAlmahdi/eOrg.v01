"use client";

import type { FC } from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, Search, BookMarked, Bookmark, Feather, Scroll, Layers,
  FileText, Languages, Laugh, BookText, Compass, History, GraduationCap,
  Music, Flame, MoonStar, Cross, Sun, Flower2
} from "lucide-react";

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
const getGenreIcon = (slug: string, rawText: string): FC<{ className?: string }> => {
  const cleanSlug = slug.toLowerCase().trim();
  const cleanText = rawText.toLowerCase().trim();

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

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

interface GenreItem {
  slug: string;
  label: string;
  rawGenre: string;
  count: number;
}

interface GenreListViewProps {
  genres: GenreItem[];
  isHomePage?: boolean;
  totalGenresCount: number;
}

export const GenreListView: FC<GenreListViewProps> = ({
  genres,
  isHomePage = false,
  totalGenresCount,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("সব");

  // 🔹 ১. বিদ্যমান জনরাগুলোর প্রথম বর্ণ ডাইনামিক্যালি বের করা ও বাংলা বর্ণানুক্রমিকভাবে সাজানো
  const availableLetters = useMemo(() => {
    if (isHomePage) return [];

    const lettersSet = new Set<string>();

    genres.forEach((item) => {
      const firstChar = item.label.trim().charAt(0);
      if (firstChar) {
        lettersSet.add(firstChar);
      }
    });

    // বাংলা বর্ণানুক্রমিক সর্টিং (অ, আ, ই ... ক, খ ...)
    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, "bn", { sensitivity: "base" })
    );

    return ["সব", ...sortedLetters];
  }, [genres, isHomePage]);

  // 🔹 ২. ফিল্টারিং লজিক (সার্চ বার ও ডাইনামিক আদ্যক্ষর ফিল্টার)
  const filteredGenres = useMemo(() => {
    if (isHomePage) return genres;

    return genres.filter((item) => {
      const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
      const firstChar = item.label.trim().charAt(0);
      const matchesLetter = selectedLetter === "সব" || firstChar === selectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [genres, searchQuery, selectedLetter, isHomePage]);

  return (
    <div className="w-full px-0">
      {!isHomePage && (
        <div className="p-4 mb-3 space-y-4 border border-teal-100 rounded shadow-sm bg-white/90 backdrop-blur-md">
          {/* লাইভ সার্চ বার */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute w-5 h-5 text-teal-600 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="ঘরানার নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-teal-200 rounded focus:outline-none focus:ring-2 focus:ring-[#008080] font-tarunima text-sm bg-teal-50/30 text-gray-800"
            />
          </div>

          {/* 🔹 ডাইনামিক আদ্যক্ষর কুইক ফিল্টার বার */}
          {availableLetters.length > 1 && (
            <div className="mt-3 w-full flex flex-wrap items-center justify-center gap-0.5 py-1 px-2 bg-orange-50/50 rounded border border-orange-100 text-xs sm:text-sm md:text-base lg:text-lg font-tarunima shadow-xs">
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-2.5 py-1 text-xs md:text-sm font-semibold rounded transition-colors ${selectedLetter === letter
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

      {/* ঘরানা কার্ড গ্রিড */}
      {filteredGenres.length === 0 ? (
        <div className="p-8 text-center text-gray-600 rounded bg-white/80 font-tarunima">
          কোন ঘরানা পাওয়া যায়নি।
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 p-0">
          {filteredGenres.map(({ slug, label, rawGenre, count }) => {
            const IconComponent = getGenreIcon(slug, rawGenre);

            return (
              <Link
                key={slug}
                href={`/genre/${slug}`}
                className="flex items-center justify-between gap-2 px-2 py-2 rounded bg-white/90 text-[#008080] border border-teal-100 shadow-sm transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-lg hover:border-teal-300 hover:scale-[1.02] shrink-0 grow basis-full sm:basis-[calc(50%-0.35rem)] lg:basis-[calc(33.333%-0.45rem)] xl:basis-[calc(25%-0.5rem)] 2xl:basis-[calc(20%-0.5rem)] max-w-full group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2.5 rounded bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-[#ffffff] transition-colors duration-300 shrink-0">
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                  </div>
                  <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-base font-semibold leading-snug font-tarunima truncate transition-colors">
                    {label}
                  </h3>
                </div>

                <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-2.5 py-1 rounded text-xs md:text-sm font-semibold">
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