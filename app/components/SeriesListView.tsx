"use client";

import type { FC } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

interface SeriesItem {
  label: string;
  slug: string;
  count: number;
}

interface SeriesListViewProps {
  series: SeriesItem[];
  isHomePage?: boolean;
  totalSeriesCount: number;
}

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

export const SeriesListView: FC<SeriesListViewProps> = ({
  series,
  isHomePage,
  totalSeriesCount,
}) => {
  return (
    <div className="w-full p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {series.map((item) => (
          <Link
            key={item.slug}
            href={`/series/${item.slug}`}
            className="flex items-center justify-between p-3.5 bg-white/80 hover:bg-white rounded border border-gray-100 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Layers className="size-4 text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-900 truncate">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {toBengaliNumber(item.count)}
            </span>
          </Link>
        ))}
      </div>

      {isHomePage && totalSeriesCount > series.length && (
        <div className="mt-6 text-center">
          <Link
            href="/series"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-900 text-white font-medium text-sm rounded hover:bg-indigo-800 transition-colors shadow-sm"
          >
            সকল সিরিজ দেখুন ({toBengaliNumber(totalSeriesCount)})
          </Link>
        </div>
      )}
    </div>
  );
};