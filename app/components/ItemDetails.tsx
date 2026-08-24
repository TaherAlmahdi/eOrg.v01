'use client';

import React from 'react';
import Link from 'next/link';

export interface CustomLink {
  name: string;
  link: string;
}

export interface ItemDetailsBook {
  item?: string | { title?: string; [key: string]: unknown } | CustomLink;
  title?: string | CustomLink; // মূল বইয়ের নাম (মেইন ফোল্ডারের ইনডেক্স ফাইল থেকে)
  author?: string | CustomLink;
  translator?: string | CustomLink;
  editor?: string | CustomLink;
  pub_medium?: string | CustomLink;
  first_published?: string | number | CustomLink;
  publisher?: string | CustomLink;
  source_book?: string | number | CustomLink;
  series?: string | string[] | CustomLink | CustomLink[];
  series_name?: string | string[];
  series_links?: CustomLink[];
  series_link?: string;
  seriesOrder?: string | number;
  part?: string | number;
  volume?: string | number;
  genre?: string | string[] | CustomLink | CustomLink[];
  genre_links?: CustomLink[];
  [key: string]: unknown;
}

export interface ItemDetailsProps {
  book: ItemDetailsBook | null;
  series?: string | string[];
  [key: string]: unknown;
}

const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

const renderValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object' && val !== null) {
    if ('title' in val && typeof (val as any).title === 'string') {
      return String((val as any).title);
    }
    if ('name' in val && typeof (val as any).name === 'string') {
      return String((val as any).name);
    }
  }
  return '';
};

export default function ItemDetails({ book, series: explicitSeries }: ItemDetailsProps) {
  if (!book) return null;

  const seriesData = book.series || book.series_name || explicitSeries;

  const getSeriesLink = (seriesName: string): string => {
    const matchedLink = book.series_links?.find(
      (l: CustomLink) => l.name === seriesName
    )?.link;
    if (matchedLink) return matchedLink;
    if (book.series_link) return book.series_link;
    return `/series/${encodeURIComponent(seriesName)}`;
  };

  return (
    <div className="space-y-3 font-tarunima">
      <div className="p-2 bg-white border border-gray-100 rounded shadow-sm">
        <div className="space-y-2 text-sm text-gray-800">
          
          {/* ১. বর্তমান পাতার নাম (আইটেম টাইটেল) */}
          {book.item && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">প্রকরণ</span>
              <span className="text-gray-400">:</span>
              <span>
                {typeof book.item === 'object' && book.item !== null && 'title' in book.item 
                  ? renderValue((book.item as any).title) 
                  : renderValue(book.item)}
              </span>
            </div>
          )}

          {/* ২. মূল বইয়ের নাম (মেইন ফোল্ডারের ইনডেক্স ফাইল থেকে আসা book.title) */}
          {book.title && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">বই</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.title)}</span>
            </div>
          )}

          {book.author && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">লেখক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.author)}</span>
            </div>
          )}

          {book.translator && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">অনুবাদক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.translator)}</span>
            </div>
          )}

          {book.editor && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">সম্পাদক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.editor)}</span>
            </div>
          )}

          {book.pub_medium && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">প্রথম প্রকাশ</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.pub_medium)}</span>
            </div>
          )}

          {book.first_published && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">গ্রন্থরূপ</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(renderValue(book.first_published))}</span>
            </div>
          )}

          {book.publisher && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">প্রকাশক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.publisher)}</span>
            </div>
          )}

          {book.source_book && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">অনুস্মৃতি</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(renderValue(book.source_book))}</span>
            </div>
          )}

          {seriesData && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">সিরিজ</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1 items-baseline">
                {Array.isArray(seriesData) ? (
                  seriesData.map((s: unknown, index: number) => {
                    const seriesName = renderValue(s);
                    if (!seriesName) return null;
                    const href = getSeriesLink(seriesName);
                    const isLast = index === (seriesData as unknown[]).length - 1;

                    return (
                      <span key={index}>
                        <Link
                          href={href}
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {seriesName}
                        </Link>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <Link
                    href={getSeriesLink(renderValue(seriesData))}
                    className="text-blue-600 hover:underline transition-colors"
                  >
                    {renderValue(seriesData)}
                  </Link>
                )}

                {(book.seriesOrder || book.part || book.volume) && (
                  <span className="text-gray-500 ml-1">
                    (পর্ব {toBengaliNumber(renderValue(book.seriesOrder || book.part || book.volume))})
                  </span>
                )}
              </span>
            </div>
          )}

          {book.genre && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">ঘরানা</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(book.genre) ? (
                  book.genre.map((g: unknown, index: number) => {
                    const genreName = renderValue(g);
                    if (!genreName) return null;
                    
                    const linkObj = book.genre_links?.find(
                      (l: CustomLink) => l.name === genreName
                    ) || (typeof g === 'object' && g !== null && 'link' in g ? g : null);

                    const isLast = index === (book.genre as unknown[]).length - 1;
                    return (
                      <span key={index}>
                        {linkObj && typeof linkObj === 'object' && 'link' in linkObj && linkObj.link ? (
                          <Link
                            href={String(linkObj.link)}
                            className="text-blue-600 hover:underline"
                          >
                            {toBengaliNumber(genreName)}
                          </Link>
                        ) : (
                          toBengaliNumber(genreName)
                        )}
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  toBengaliNumber(renderValue(book.genre))
                )}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}