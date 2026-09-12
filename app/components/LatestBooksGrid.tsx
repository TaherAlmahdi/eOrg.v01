import Link from 'next/link';
import Image from 'next/image';

interface BookItem {
  id?: string;
  slug?: string;
  title?: string;
  author?: string;
  authorSlug?: string;
  cover?: string;
  [key: string]: unknown;
}

interface LatestBooksGridProps {
  books: BookItem[];
  getAuthorSlug: (book: BookItem) => string;
}

export default function LatestBooksGrid({ books, getAuthorSlug }: LatestBooksGridProps) {
  if (books.length === 0) {
    return <p className="py-6 text-sm text-slate-500">কোনো নতুন বই পাওয়া যায়নি।</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-1.5 p-0 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 bg-gray-200/50">
      {books.map((book, index) => {
        const bookSlug = String(book.slug || book.id || '');
        const authorSlug = getAuthorSlug(book);

        const responsiveVisibilityClass =
          index >= 16
            ? "block sm:hidden xl:block"
            : index >= 8
              ? "block sm:hidden md:block"
              : "block";

        return (
          <div
            key={bookSlug || index}
            className={`flex flex-col bg-white rounded border border-slate-200 shadow-sm transition-all hover:shadow-md group ${responsiveVisibilityClass}`}
          >
            <Link href={`/book/${encodeURIComponent(bookSlug)}`} className="relative block w-full overflow-hidden rounded-t aspect-2/3 bg-slate-100">
              <Image
                src={book.cover || '/cover/default-cover.webp'}
                alt={book.title || 'বইয়ের প্রচ্ছদ'}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            </Link>

            <div className="flex flex-col justify-between p-3 grow">
              <div className="text-center">
                <h3 className="text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700 line-clamp-2">
                  <Link href={`/book/${encodeURIComponent(bookSlug)}`}>
                    {book.title || 'শিরোনামহীন'}
                  </Link>
                </h3>

                <p className="mt-1 text-xs md:text-sm text-gray-500 font-tarunima">
                  {book.author ? (
                    <Link
                      href={`/author/${encodeURIComponent(authorSlug)}`}
                      className="transition-colors hover:text-emerald-600 hover:underline"
                    >
                      {book.author}
                    </Link>
                  ) : (
                    'অজানা লেখক'
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}