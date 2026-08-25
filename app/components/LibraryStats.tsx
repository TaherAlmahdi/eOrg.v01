import type { FC } from "react";
import { Users, Library, Layers, FileText } from "lucide-react";

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

interface LibraryStatsProps {
  totalAuthors: number;
  totalBooks: number;
  totalSeries: number;
  totalItems: number;
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

export const LibraryStats: FC<LibraryStatsProps> = ({
  totalAuthors,
  totalBooks,
  totalSeries,
  totalItems,
}) => {
  const statsData: StatItem[] = [
    {
      title: "আমাদের পরিবারে",
      subtitle: "সম্মানিত লেখক",
      count: totalAuthors,
      unit: "জন",
      icon: Users,
      bgColor: "bg-teal-50",
      textColor: "text-[#008080]",
      borderColor: "border-teal-100/50",
      countColor: "text-[#008080]",
    },
    {
      title: "এডুলিচার পাঠশালায়",
      subtitle: "প্রকাশিত গ্রন্থ সংখ্যা",
      count: totalBooks,
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
      count: totalSeries,
      unit: "টি",
      icon: Layers,
      bgColor: "bg-indigo-50",
      textColor: "text-[#4f46e5]",
      borderColor: "border-indigo-100/50",
      countColor: "text-[#4f46e5]",
    },
    {
      title: "সংকলন ও বিন্যাস",
      subtitle: "মোট প্রকরণ",
      count: totalItems,
      unit: "টি",
      icon: FileText,
      bgColor: "bg-rose-50",
      textColor: "text-[#e11d48]",
      borderColor: "border-rose-100/50",
      countColor: "text-[#e11d48]",
    },
  ];

  return (
    <div className="grid w-full grid-cols-1 gap-2 p-0 mb-3 sm:grid-cols-2 md:grid-cols-4">
      {statsData.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className="flex items-center justify-between p-2 transition-all duration-300 border rounded shadow-sm bg-white/90 backdrop-blur-md border-white/60 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded ${item.bgColor} ${item.textColor} border ${item.borderColor}`}>
                <IconComponent size={32} className="shrink-0" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-500">{item.title}</p>
                <h2 className="text-lg font-bold text-gray-800 md:text-xl">
                  {item.subtitle}{" "}
                  <span className={`${item.countColor} font-black text-2xl md:text-3xl mx-1`}>
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