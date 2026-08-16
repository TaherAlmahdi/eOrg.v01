import type { FC } from "react";
import { Users, Library, Layers } from "lucide-react";

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

interface LibraryStatsProps {
  totalAuthors: number;
  totalBooks: number;
  totalSeries: number;
}

export const LibraryStats: FC<LibraryStatsProps> = ({
  totalAuthors,
  totalBooks,
  totalSeries,
}) => {
  return (
    <div className="grid w-full grid-cols-1 gap-2 p-2 mb-3 sm:grid-cols-2 md:grid-cols-3">
      {/* লেখক সংখ্যা */}
      <div className="flex items-center justify-between p-2 transition-all duration-300 border rounded shadow-sm bg-white/90 backdrop-blur-md border-white/60 hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded bg-teal-50 text-[#008080] border border-teal-100/50">
            <Users size={32} className="shrink-0" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-500">আমাদের পরিবারে</p>
            <h2 className="text-lg font-bold text-gray-800 md:text-xl">
              সম্মানিত লেখক{" "}
              <span className="text-[#008080] font-black text-2xl md:text-3xl mx-1">
                {toBengaliNumber(totalAuthors)}
              </span>{" "}
              জন
            </h2>
          </div>
        </div>
      </div>

      {/* বই সংখ্যা */}
      <div className="flex items-center justify-between p-2 transition-all duration-300 border rounded shadow-sm bg-white/90 backdrop-blur-md border-white/60 hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded bg-amber-50 text-[#cc7a00] border border-amber-100/50">
            <Library size={32} className="shrink-0" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-500">এডুলিচার পাঠশালায়</p>
            <h2 className="text-lg font-bold text-gray-800 md:text-xl">
              প্রকাশিত গ্রন্থ সংখ্যা{" "}
              <span className="text-[#cc7a00] font-black text-2xl md:text-3xl mx-1">
                {toBengaliNumber(totalBooks)}
              </span>{" "}
              টি
            </h2>
          </div>
        </div>
      </div>

      {/* সিরিজ সংখ্যা */}
      <div className="flex items-center justify-between p-2 transition-all duration-300 border rounded shadow-sm bg-white/90 backdrop-blur-md border-white/60 hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded bg-indigo-50 text-[#4f46e5] border border-indigo-100/50">
            <Layers size={32} className="shrink-0" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-500">বিশেষ আয়োজনে</p>
            <h2 className="text-lg font-bold text-gray-800 md:text-xl">
              মোট গ্রন্থ সিরিজ{" "}
              <span className="text-[#4f46e5] font-black text-2xl md:text-3xl mx-1">
                {toBengaliNumber(totalSeries)}
              </span>{" "}
              টি
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};