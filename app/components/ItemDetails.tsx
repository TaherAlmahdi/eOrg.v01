'use client';

import Link from 'next/link';
import BookCover from '@/app/components/BookCover';

// সংখ্যা বাংলায় রূপান্তরের হেল্পার
const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

// যেকোনো ভ্যালুকে নিরাপদভাবে স্ট্রিংয়ে রূপান্তর করার হেল্পার
const renderValue = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object' && val !== null) {
    if ('name' in val && typeof (val as any).name === 'string') {
      return String((val as any).name);
    }
    if ('title' in val && typeof (val as any).title === 'string') {
      return String((val as any).title);
    }
  }
  return '';
};

interface CustomLink {
  name: string;
  link: string;
}

export interface ItemDetailsProps {
  book: any;      // মূল ডেটা অবজেক্ট
  items?: any; 
}

export default function BookDetails({ book, items: explicititems }: ItemDetailsProps) {
  if (!book) return null;

  // আপনার সংজ্ঞায়ন অনুযায়ী নামগুলো আলাদা করা হলো:
  const bookName = renderValue(book.book || book.title); // মূল বইয়ের নাম
  const itemName = renderValue(book.item);                // প্রকরণের নাম (যেমন: প্রবন্ধ/গল্প)
  const currentTitle = renderValue(book.current_title || book.page_title || book.title); // বর্তমান পাতার নাম

  const itemsData = book.items || book.items_name || explicititems;

  const getItemsLink = (itemsName: string): string => {
    const matchedLink = book.items_links?.find(
      (l: CustomLink) => l.name === itemsName
    )?.link;
    if (matchedLink) return matchedLink;
    if (book.items_link) return book.items_link;
    return `/items/${encodeURIComponent(itemsName)}`;
  };

  return (
    <div className="space-y-3 font-tarunima">
      {/* ১. কভার বাটন ও কভার ছবির আলাদা কার্ড */}
      <BookCover coverImage={book.cover_image} title={currentTitle || bookName} />

      {/* ২. পুস্তক বিবরণীর বিস্তারিত তথ্যের মূল কার্ড */}
      <div className="p-2 bg-white border border-gray-100 rounded shadow-sm">
        <div className="space-y-2 text-sm text-gray-800">
          
          {/* প্রকরণ (Item) এবং বর্তমান পাতার নাম (Title) */}
          {itemName && currentTitle && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">{itemName}</span>
              <span className="text-gray-400">:</span>
              <span>{currentTitle}</span>
            </div>
          )}

          {/* মূল বইয়ের নাম (Book) */}
          {bookName && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">বই</span>
              <span className="text-gray-400">:</span>
              <span>{bookName}</span>
            </div>
          )}

          {/* লেখক */}
          {book.author && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">লেখক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.author)}</span>
            </div>
          )}

          {/* অনুবাদক */}
          {book.translator && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">অনুবাদক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.translator)}</span>
            </div>
          )}

          {/* সম্পাদক */}
          {book.editor && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">সম্পাদক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.editor)}</span>
            </div>
          )}

          {/* প্রথম প্রকাশ */}
          {book.pub_medium && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">প্রথম প্রকাশ</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.pub_medium)}</span>
            </div>
          )}

          {/* গ্রন্থরূপ */}
          {book.first_published && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">গ্রন্থরূপ</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(renderValue(book.first_published))}</span>
            </div>
          )}

          {/* প্রকাশক */}
          {book.publisher && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">প্রকাশক</span>
              <span className="text-gray-400">:</span>
              <span>{renderValue(book.publisher)}</span>
            </div>
          )}

          {/* অনুস্মৃতি */}
          {book.source_book && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">অনুস্মৃতি</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(renderValue(book.source_book))}</span>
            </div>
          )}

          {/* সিরিজ */}
          {itemsData && (
            <div className="grid grid-cols-[60px_10px_1fr] items-baseline">
              <span className="font-bold">সিরিজ</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1 items-baseline">
                {Array.isArray(itemsData) ? (
                  itemsData.map((s: unknown, index: number) => {
                    const sName = renderValue(s);
                    if (!sName) return null;
                    const href = getItemsLink(sName);
                    const isLast = index === (itemsData as unknown[]).length - 1;

                    return (
                      <span key={index}>
                        <Link
                          href={href}
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {sName}
                        </Link>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <Link
                    href={getItemsLink(renderValue(itemsData))}
                    className="text-blue-600 hover:underline transition-colors"
                  >
                    {renderValue(itemsData)}
                  </Link>
                )}

                {(book.itemsOrder || book.part || book.volume) && (
                  <span className="text-gray-500 ml-1">
                    (পর্ব {toBengaliNumber(renderValue(book.itemsOrder || book.part || book.volume))})
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
                  book.genre.map((g: unknown, index: number) => {
                    const gName = renderValue(g);
                    if (!gName) return null;

                    const linkObj = book.genre_links?.find(
                      (l: CustomLink) => l.name === gName
                    ) || (typeof g === 'object' && g !== null && 'link' in g ? g : null);

                    const isLast = index === (book.genre as unknown[]).length - 1;
                    return (
                      <span key={index}>
                        {linkObj && typeof linkObj === 'object' && 'link' in linkObj && (linkObj as any).link ? (
                          <Link
                            href={String((linkObj as any).link)}
                            className="text-blue-600 hover:underline"
                          >
                            {toBengaliNumber(gName)}
                          </Link>
                        ) : (
                          toBengaliNumber(gName)
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