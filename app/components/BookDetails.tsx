'use client';

import Link from 'next/link';
import BookCover from '@/app/components/BookCover';

// সংখ্যা বাংলায় রূপান্তরের হেল্পার
const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

interface CustomLink {
  name: string;
  link: string;
}

export interface BookDetailsProps {
  book: any;
  series?: any; // অভিভাবক ফাইল থেকে এক্সপ্লিসিটলি পাস করলেও যেন TypeScript এরর না দেয়
}

export default function BookDetails({ book, series: explicitSeries }: BookDetailsProps) {
  if (!book) return null;

  // book.series, book.series_name অথবা প্রপস থেকে আসা explicitSeries গ্রহণ
  const seriesData = book.series || book.series_name || explicitSeries;

  // সিরিজের লিঙ্ক পাওয়ার জন্য হেল্পার ফাংশন
  const getSeriesLink = (seriesName: string): string => {
    // ১. যদি series_links এ্যারে থেকে নাম ম্যাচ করে
    const matchedLink = book.series_links?.find(
      (l: CustomLink) => l.name === seriesName
    )?.link;
    if (matchedLink) return matchedLink;

    // ২. যদি সরাসরি book.series_link থাকে
    if (book.series_link) return book.series_link;

    // ৩. কোনো নির্দিষ্ট লিঙ্ক না থাকলে ডায়নামিক স্লাগ রুট ফলব্যাক
    return `/series/${encodeURIComponent(seriesName)}`;
  };

  return (
    <div className="space-y-3 font-tarunima">
      {/* ১. কভার বাটন ও কভার ছবির আলাদা কার্ড (উপরে থাকবে) */}
      <BookCover coverImage={book.cover_image} title={book.title} />

      {/* ২. পুস্তক বিবরণীর বিস্তারিত তথ্যের মূল কার্ড (নিচে থাকবে) */}
      <div className="p-2 bg-white border border-gray-100 rounded shadow-sm">
        <div className="space-y-2 text-sm text-gray-800">
          {/* বইয়ের নাম */}
          {book.title && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">বই</span>
              <span className="text-gray-400">:</span>
              <span>{book.title}</span>
            </div>
          )}

          {/* লেখক */}
          {book.author && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">লেখক</span>
              <span className="text-gray-400">:</span>
              <span>{book.author}</span>
            </div>
          )}

          {/* অনুবাদক */}
          {book.translator && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">অনুবাদক</span>
              <span className="text-gray-400">:</span>
              <span>{book.translator}</span>
            </div>
          )}

          {/* সম্পাদক */}
          {book.editor && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">সম্পাদক</span>
              <span className="text-gray-400">:</span>
              <span>{book.editor}</span>
            </div>
          )}

          {/* প্রথম প্রকাশ */}
          {book.pub_medium && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">প্রথম প্রকাশ</span>
              <span className="text-gray-400">:</span>
              <span>{book.pub_medium}</span>
            </div>
          )}

          {/* গ্রন্থরূপ */}
          {book.first_published && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">গ্রন্থরূপ</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(book.first_published)}</span>
            </div>
          )}

          {/* প্রকাশক */}
          {book.publisher && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">প্রকাশক</span>
              <span className="text-gray-400">:</span>
              <span>{book.publisher}</span>
            </div>
          )}

          {/* অনুস্মৃতি */}
          {book.source_book && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">অনুস্মৃতি</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(book.source_book)}</span>
            </div>
          )}

          {/* সিরিজ / গ্রন্থমালা */}
          {seriesData && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">সিরিজ</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1 items-baseline">
                {Array.isArray(seriesData) ? (
                  seriesData.map((s: string, index: number) => {
                    const href = getSeriesLink(s);
                    const isLast = index === (seriesData as string[]).length - 1;

                    return (
                      <span key={index}>
                        <Link
                          href={href}
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {s}
                        </Link>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <Link
                    href={getSeriesLink(String(seriesData))}
                    className="text-blue-600 hover:underline transition-colors"
                  >
                    {seriesData}
                  </Link>
                )}

                {/* যদি পর্ব / seriesOrder থাকে তবে তা ব্র্যাকেটে প্রদর্শন */}
                {(book.seriesOrder || book.part || book.volume) && (
                  <span className="text-gray-500 ml-1">
                    (পর্ব {toBengaliNumber(book.seriesOrder || book.part || book.volume)})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* ঘরানা */}
          {book.genre && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">ঘরানা</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(book.genre) ? (
                  book.genre.map((g: string, index: number) => {
                    const linkObj = book.genre_links?.find(
                      (l: CustomLink) => l.name === g
                    );
                    const isLast =
                      index === (book.genre as string[]).length - 1;
                    return (
                      <span key={index}>
                        {linkObj ? (
                          <Link
                            href={linkObj.link}
                            className="text-blue-600 hover:underline"
                          >
                            {toBengaliNumber(g)}
                          </Link>
                        ) : (
                          toBengaliNumber(g)
                        )}
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  toBengaliNumber(book.genre)
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}