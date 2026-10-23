import { COVER_BASE } from '@/app/lib/cover-base';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, ChevronRight } from 'lucide-react';
import { getSlug, getAuthorSlugFromTitle } from '@/app/lib/content/core/registry';
import { getPopularSlugs } from '@/lib/popular/views';

interface BookItem {
  id?: string;
  slug?: string;
  title?: string;
  author?: string;
  authorSlug?: string;
  cover?: string;
  [key: string]: unknown;
}

interface PopularBooksProps {
  books: BookItem[];
}

const getCoverImageUrl = (coverPath?: string | null): string => {
  if (!coverPath) return `${COVER_BASE}/cover/default-cover.webp`;
  if (coverPath.startsWith('http://') || coverPath.startsWith('https://') || coverPath.startsWith(`${COVER_BASE}/`)) return coverPath;

  let cleanPath = coverPath.trim().replace(/\\/g, '/');
  if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', '');
  else if (cleanPath.startsWith('/public/')) cleanPath = cleanPath.replace('/public/', '');
  cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  cleanPath = cleanPath.replace(/\.(webp|jpg|png)\.(webp|jpg|png)$/i, '.$1');

  if (cleanPath.startsWith('cover/')) return `${COVER_BASE}/${cleanPath}`;
  return `${COVER_BASE}/cover/${cleanPath}`;
};

const getAuthorSlug = (book: BookItem): string => {
  const authorName = String(book.author || '').trim();
  if (authorName) {
    const registrySlug = getAuthorSlugFromTitle(authorName) || getSlug('authors', authorName);
    if (registrySlug && registrySlug !== authorName && registrySlug !== encodeURIComponent(authorName)) {
      return registrySlug;
    }
  }
  if (book.authorSlug) return String(book.authorSlug);
  return authorName.toLowerCase().replace(/\s+/g, '-');
};

// Most-viewed books (counts from D1). First row of 8 shows as soon as there are views;
// the second row appears only once 16 books have views.
export default async function PopularBooks({ books }: PopularBooksProps) {
  const slugs = await getPopularSlugs(16);
  if (slugs.length === 0) return null;

  const bySlug = new Map(books.map((b) => [String(b.slug || b.id || '').toLowerCase(), b]));
  const popular = slugs.map((s) => bySlug.get(s.toLowerCase())).filter((b): b is BookItem => !!b);
  if (popular.length === 0) return null;

  const shown = popular.slice(0, popular.length >= 16 ? 16 : 8);

  return (
    <section aria-labelledby="popular-books-heading">
      <div className="flex w-full items-center justify-between mt-4 px-3 sm:px-4 py-2 mb-4 rounded bg-teal-50/90 text-[#008080] border border-teal-100 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Flame size={22} className="shrink-0 animate-pulse text-emerald-600 sm:w-6 sm:h-6" />
          <h2 id="popular-books-heading" className="text-base sm:text-lg md:text-xl font-black text-slate-800 font-tarunima truncate">
            <span className="text-[#008080]">পাঠকপ্রিয়</span> <span className="text-[#cc7a00]">বই</span>
          </h2>
        </div>
        <Link
          href="/books"
          className="text-xs sm:text-sm md:text-base font-medium font-tarunima text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors group shrink-0"
        >
          সব বই
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-1.5 md:gap-2 lg:gap-2 p-0 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 bg-gray-200/50">
        {shown.map((book, index) => {
          const bookSlug = String(book.slug || book.id);
          const authorSlug = getAuthorSlug(book);
          const responsiveVisibilityClass = index >= 8 ? 'hidden sm:flex' : 'flex';

          return (
            <div
              key={bookSlug}
              className={`flex-col bg-white rounded border border-slate-200 shadow-sm transition-all hover:shadow-md group ${responsiveVisibilityClass}`}
            >
              <Link href={`/book/${encodeURIComponent(bookSlug)}`} className="relative block w-full overflow-hidden rounded-t aspect-2/3 bg-slate-100">
                <Image
                  src={getCoverImageUrl(book.cover)}
                  alt={book.title || 'বইয়ের প্রচ্ছদ'}
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
    </section>
  );
}
