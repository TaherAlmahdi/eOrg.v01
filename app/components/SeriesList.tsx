import type { FC } from "react";
import { getAllBooks } from "@/app/lib/books"; 
import { CONTENT_REGISTRY, getSlug } from "@/app/lib/content/core/registry";
import { SeriesListView, type SeriesItem } from "./SeriesListView";
import { Users, Library } from "lucide-react";

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

// ১. কোনো আইটেম থেকে সিরিজের নামগুলো নিরাপদভাবে বের করার হেলপার
const parseSeriesField = (item: any): string[] => {
  if (!item) return [];
  const fields = [item.Series, item.Seriess, item.series];
  return fields
    .flat()
    .filter((val): val is string => typeof val === "string" && val.trim() !== "")
    .map((val) => val.trim());
};

// ২. বই ও বইয়ের চাইল্ড আইটেমসমূহ থেকে সব সিরিজ সংগ্রহ করার হেলপার
const collectAllSeriesFromBook = (book: any): string[] => {
  const seriesSet = new Set<string>();

  const processItem = (item: any) => {
    parseSeriesField(item).forEach((s) => seriesSet.add(s));
  };

  processItem(book);

  const processSubArray = (arr?: any[]) => {
    if (Array.isArray(arr)) arr.forEach(processItem);
  };

  const nestedArrays = [
    book.directChapters,
    book.chapters,
    book.stories,
    book.items,
    book.articles,
    book.contents,
  ];
  nestedArrays.forEach(processSubArray);

  if (Array.isArray(book.volumes)) {
    book.volumes.forEach((vol: any) => {
      processItem(vol);
      const volSubArrays = [vol.chapters, vol.stories, vol.items, vol.directChapters];
      volSubArrays.forEach(processSubArray);
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

  const contributorSet = new Set<string>();
  const seriesMap = new Map<string, SeriesItem>();

  allBooks.forEach((book: any) => {
    // 🔹 লেখক, অনুবাদক ও সম্পাদকদের সংগ্রহ করা
    ["author", "translator", "editor"].forEach((role) => {
      if (typeof book[role] === "string" && book[role].trim()) {
        contributorSet.add(book[role].trim());
      }
    });

    const bookSeries = collectAllSeriesFromBook(book);
    const finalSeries = bookSeries.length > 0 ? bookSeries : ["অন্যান্য"];

    finalSeries.forEach((rawSeries) => {
      const cleanSeries = rawSeries.trim();
      if (!cleanSeries) return;

      // 🔹 টাইপ-সেফ প্যারামিটার ব্যবহার করা হয়েছে ("series")
      const seriesSlug = getSlug("series", cleanSeries);
      const registry = (CONTENT_REGISTRY as Record<string, Record<string, string>>).series || {};

      if (seriesMap.has(seriesSlug)) {
        const current = seriesMap.get(seriesSlug)!;
        seriesMap.set(seriesSlug, { ...current, count: current.count + 1 });
      } else {
        const label = registry[seriesSlug] || cleanSeries;
        seriesMap.set(seriesSlug, {
          label,
          slug: seriesSlug,
          rawSeries: cleanSeries,
          count: 1,
        });
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

  const seriesList = limit ? sortedSeries.slice(0, limit) : sortedSeries;

  return (
    <div className="relative w-full h-auto overflow-x-clip">
      <div className="relative z-20 w-full mx-auto max-w-none">

        {/* সিরিজ তালিকা ভিউ */}
        <SeriesListView
          seriesList={seriesList}
          isHomePage={!!limit}
          totalSeriesCount={seriesMap.size}
        />
      </div>
    </div>
  );
};

export default SeriesList;