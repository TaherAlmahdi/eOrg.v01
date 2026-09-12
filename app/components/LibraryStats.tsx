import type { FC } from "react";
import { Users, Library, Layers, FileText, Tags } from "lucide-react";
import { libraryStats } from "@/app/lib/generated/library-stats";

const toBengaliNumber = (num: number): string => {
  return (num || 0).toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);
};

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

export const LibraryStats: FC = () => {
  const statsData: StatItem[] = [
    {
      title: "আমাদের পরিবারে",
      subtitle: "লেখক",
      count: libraryStats.totalAuthors,
      unit: "জন",
      icon: Users,
      bgColor: "bg-teal-50",
      textColor: "text-[#008080]",
      borderColor: "border-teal-100/50",
      countColor: "text-[#008080]",
    },
    {
      title: "এডুলিচার পাঠশালায়",
      subtitle: "পুস্তক",
      count: libraryStats.totalBooks,
      unit: "টি",
      icon: Library,
      bgColor: "bg-amber-50",
      textColor: "text-[#cc7a00]",
      borderColor: "border-amber-100/50",
      countColor: "text-[#cc7a00]",
    },
    {
      title: "বিশেষ আয়োজন",
      subtitle: "সিরিজ",
      count: libraryStats.totalSeries,
      unit: "টি",
      icon: Layers,
      bgColor: "bg-indigo-50",
      textColor: "text-[#4f46e5]",
      borderColor: "border-indigo-100/50",
      countColor: "text-[#4f46e5]",
    },
    {
      title: "বিষয় ও ভাবধারা",
      subtitle: "ঘরানা",
      count: libraryStats.totalGenres,
      unit: "টি",
      icon: Tags,
      bgColor: "bg-rose-50",
      textColor: "text-[#e11d48]",
      borderColor: "border-rose-100/50",
      countColor: "text-[#e11d48]",
    },
    {
      title: "সাহিত্য রূপ",
      subtitle: "প্রকরণ",
      count: libraryStats.totalItems,
      unit: "টি",
      icon: FileText,
      bgColor: "bg-purple-50",
      textColor: "text-[#7c3aed]",
      borderColor: "border-purple-100/50",
      countColor: "text-[#7c3aed]",
    },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-2 p-0 mb-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 font-tarunima">
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