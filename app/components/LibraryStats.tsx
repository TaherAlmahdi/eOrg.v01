import type { FC } from "react";
import { Users, Library, Layers, Tags } from "lucide-react";

const toBengaliNumber = (num: number | string): string => {
  const parsedNum = Number(num);
  const validNum = isNaN(parsedNum) ? 0 : parsedNum;
  return validNum.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);
};

export interface LibraryStatsProps {
  totalAuthors?: number;
  totalBooks?: number;
  totalSeries?: number;
  totalGenres?: number;
  authorsCount?: number;
  booksCount?: number;
  seriesCount?: number;
  genresCount?: number;
  totalEditors?: number;
  editorsCount?: number;
  editorCount?: number;
  totalTranslators?: number;
  translatorsCount?: number;
  translatorCount?: number;
  authorCount?: number;
}

interface StatItem {
  title: string;
  subtitle: string;
  count: number;
  unit: string;
  icon: FC<{ size: number; className?: string }>;
  bgColor: string;
  textColor: string;
  borderColor: string;
  countColor: string;
}

export const LibraryStats: FC<LibraryStatsProps> = (props) => {
  const authors = props.totalAuthors ?? props.authorsCount ?? props.authorCount ?? 0;
  const editors = props.totalEditors ?? props.editorsCount ?? props.editorCount ?? 0;
  const translators = props.totalTranslators ?? props.translatorsCount ?? props.translatorCount ?? 0;
  
  // লেখক, এডিটর এবং ট্রান্সলেটর একসাথে যোগ করা হলো
  const combinedAuthors = authors + editors + translators;

  const books = props.totalBooks ?? props.booksCount ?? 0;
  const series = props.totalSeries ?? props.seriesCount ?? 0;
  const genres = props.totalGenres ?? props.genresCount ?? 0;

  const statsData: StatItem[] = [
    {
      title: "আমাদের পরিবারে",
      subtitle: "সম্মানিত লেখক",
      count: combinedAuthors,
      unit: "জন",
      icon: Users,
      bgColor: "bg-teal-50",
      textColor: "text-[#008080]",
      borderColor: "border-teal-100/50",
      countColor: "text-[#008080]",
    },
    {
      title: "এডুলিচার পাঠশালায়",
      subtitle: "প্রকাশিত গ্রন্থ",
      count: books,
      unit: "টি",
      icon: Library,
      bgColor: "bg-amber-50",
      textColor: "text-[#cc7a00]",
      borderColor: "border-amber-100/50",
      countColor: "text-[#cc7a00]",
    },
    {
      title: "বিশেষ আয়োজন",
      subtitle: "মোট সিরিজ",
      count: series,
      unit: "টি",
      icon: Layers,
      bgColor: "bg-indigo-50",
      textColor: "text-[#4f46e5]",
      borderColor: "border-indigo-100/50",
      countColor: "text-[#4f46e5]",
    },
    {
      title: "বিষয় ও ভাবধারা",
      subtitle: "মোট ঘরানা",
      count: genres,
      unit: "টি",
      icon: Tags,
      bgColor: "bg-rose-50",
      textColor: "text-[#e11d48]",
      borderColor: "border-rose-100/50",
      countColor: "text-[#e11d48]",
    },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-2 p-0 mb-3 sm:grid-cols-2 md:grid-cols-4 font-tarunima">
      {statsData.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className="flex items-center justify-between p-2.5 transition-all duration-300 border rounded shadow-xs bg-white/90 backdrop-blur-md border-teal-100/60 hover:shadow-md"
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded ${item.bgColor} ${item.textColor} border ${item.borderColor} shrink-0`}>
                <IconComponent size={28} className="shrink-0" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-gray-500">{item.title}</p>
                <h2 className="text-sm md:text-base font-bold text-gray-800 leading-tight">
                  {item.subtitle}{" "}
                  <span className={`${item.countColor} font-black text-xl md:text-2xl mx-0.5 inline-block`}>
                    {toBengaliNumber(item.count)}
                  </span>{" "}
                  {item.unit}
                </h2>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};