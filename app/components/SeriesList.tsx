import type { FC } from "react";
import { getAllBooks } from "@/app/lib/books"; 
import { CONTENT_REGISTRY, getSlug } from "@/app/lib/content/core/registry";
import { SeriesListView } from "./SeriesListView"; // পরবর্তী ধাপে তৈরি করবেন
import { BookOpen, Layers } from 'lucide-react';

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

// 🔹 সিরিজ ফিল্ড পার্স করার হেল্পার
const parseSeriesField = (item: any): string[] => {
  const result: string[] = [];
  if (!item) return result;
  if (typeof item.series === 'string' && item.series.trim()) {
    result.push(item.series.trim());
  } else if (Array.isArray(item.series)) {
    item.series.forEach((s: any) => typeof s === 'string' && s.trim() && result.push(s.trim()));
  }
  return result;
};

// 🔹 বই এবং সাব-আইটেম থেকে সমস্ত সিরিজ সংগ্রহ
const collectAllSeriesFromBook = (book: any): string[] => {
  const seriesSet = new Set<string>();
  parseSeriesField(book).forEach((s) => seriesSet.add(s));

  const nestedArrays = [book.directChapters, book.chapters, book.stories, book.items, book.articles, book.contents];
  nestedArrays.forEach((arr) => {
    if (Array.isArray(arr)) arr.forEach((subItem: any) => parseSeriesField(subItem).forEach((s) => seriesSet.add(s)));
  });

  if (Array.isArray(book.volumes)) {
    book.volumes.forEach((vol: any) => {
      parseSeriesField(vol).forEach((s) => seriesSet.add(s));
      const volSubArrays = [vol.chapters, vol.stories, vol.items, vol.directChapters];
      volSubArrays.forEach((arr) => {
        if (Array.isArray(arr)) arr.forEach((subItem: any) => parseSeriesField(subItem).forEach((s) => seriesSet.add(s)));
      });
    });
  }

  return Array.from(seriesSet);
};

interface SeriesListProps {
  sortBy?: "alphabetical" | "count";
  limit?: number;
}

const SeriesList: FC<SeriesListProps> = async ({ sortBy, limit }) => {
  const allBooks = await getAllBooks();
  const seriesMap = new Map<string, { label: string; slug: string; rawSeries: string; count: number }>();

  allBooks.forEach((book: any) => {
    const bookSeriesList = collectAllSeriesFromBook(book);

    bookSeriesList.forEach((rawSeries) => {
      const cleanSeries = rawSeries.trim();
      if (!cleanSeries) return;

      const seriesSlug = getSlug("series", cleanSeries);

      if (seriesMap.has(seriesSlug)) {
        const current = seriesMap.get(seriesSlug)!;
        seriesMap.set(seriesSlug, { ...current, count: current.count + 1 });
      } else {
        const label = CONTENT_REGISTRY.series?.[seriesSlug] || cleanSeries;
        seriesMap.set(seriesSlug, { label, slug: seriesSlug, rawSeries: cleanSeries, count: 1 });
      }
    });
  });

  const effectiveSortBy = sortBy || (limit ? "count" : "alphabetical");

  const sortedSeries = Array.from(seriesMap.values()).sort((a, b) => {
    if (effectiveSortBy === "count") {
      return b.count - a.count;
    }
    return a.label.localeCompare(b.label, "bn", { sensitivity: "base" });
  });

  const series = limit ? sortedSeries.slice(0, limit) : sortedSeries;

  return (
    <div className="relative w-full h-auto overflow-x-clip">
      <div className="relative z-20 w-full max-w-none mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5 w-full p-2">
          <div className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-md rounded border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded bg-indigo-50 text-[#4f46e5] border border-indigo-100/50">
                <Layers size={32} className="shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">সংগ্রহশালায়</p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  মোট সিরিজ সংখ্যা <span className="text-[#4f46e5] font-black text-2xl md:text-3xl mx-1">{toBengaliNumber(seriesMap.size)}</span> টি
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-md rounded border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded bg-purple-50 text-[#9333ea] border border-purple-100/50">
                <BookOpen size={32} className="shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">গ্রন্থভিত্তিক</p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  সিরিজভুক্ত বই <span className="text-[#9333ea] font-black text-2xl md:text-3xl mx-1">{toBengaliNumber(allBooks.filter(b => collectAllSeriesFromBook(b).length > 0).length)}</span> টি
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 ক্লায়েন্ট ভিউ কম্পোনেন্ট */}
        <SeriesListView
          series={series}
          isHomePage={!!limit}
          totalSeriesCount={seriesMap.size}
        />
      </div>
    </div>
  );
};

export default SeriesList;