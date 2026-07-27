'use client';

import Link from 'next/link';
import BookCover from '@/app/components/BookCover';

// সংখ্যা বাংলায় রূপান্তরের হেল্পার
const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

interface GenreLink {
  name: string;
  link: string;
}

interface BookDetailsProps {
  book: any;
}

export default function BookDetails({ book }: BookDetailsProps) {
  if (!book) return null;

  return (
    <div className="space-y-3 font-tarunima">
      {/* ১. কভার বাটন ও কভার ছবির আলাদা কার্ড (উপরে থাকবে) */}
      <BookCover coverImage={book.cover_image} title={book.title} />

      {/* ২. পুস্তক বিবরণীর বিস্তারিত তথ্যের মূল কার্ড (নিচে থাকবে) */}
      <div className="p-4 bg-white border border-gray-100 rounded shadow-sm">
        <div className="space-y-2 text-sm text-gray-800">
          {/* বইয়ের নাম */}
          <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
            <span className="font-bold">বই</span>
            <span className="text-gray-400">:</span>
            <span>{book.title}</span>
          </div>

          {/* লেখক */}
          <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
            <span className="font-bold">লেখক</span>
            <span className="text-gray-400">:</span>
            <span>{book.author}</span>
          </div>

          {/* প্রথম প্রকাশ */}
          {book.pub_medium && (
            <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
              <span className="font-bold">প্রথম প্রকাশ</span>
              <span className="text-gray-400">:</span>
              <span>{book.pub_medium}</span>
            </div>
          )}

          {/* গ্রন্থরূপ */}
          {book.first_published && (
            <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
              <span className="font-bold">গ্রন্থরূপ</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(book.first_published)}</span>
            </div>
          )}

          {/* অনুস্মৃতি */}
          {book.source_book && (
            <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
              <span className="font-bold">অনুস্মৃতি</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(book.source_book)}</span>
            </div>
          )}

          {/* ঘরানা */}
          {book.genre && (
            <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
              <span className="font-bold">ঘরানা</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(book.genre) ? (
                  book.genre.map((g: string, index: number) => {
                    const linkObj = book.genre_links?.find(
                      (l: GenreLink) => l.name === g
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