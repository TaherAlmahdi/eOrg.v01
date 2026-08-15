"use client";

import type { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, BookOpen } from "lucide-react";

// 🔹 মূল বইয়ের টাইপ
export interface SeriesBook {
  id?: string;
  slug: string;
  title: string;
  author?: string;
  cover?: string;
  Series?: string | string[];
  series?: string | string[];
  first_published?: number | string;
  published?: number | string;
  authorSlug?: string;
  // [key: string]: unknown;
}

// 🔹 page.tsx এর সাথে সামঞ্জস্য রাখার জন্য অ্যালিয়াস টাইপ এক্সপোর্ট
export type BookSeries = SeriesBook;
export type BookItem = SeriesBook;

export interface SeriesViewProps {
  seriesTitle: string;
  books?: SeriesBook[];
  subdomain?: string;
}

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

export const SeriesView: FC<SeriesViewProps> = ({ seriesTitle, books = [] }) => {
  return (
    <main className="bg-[#fdfcf8] min-h-screen font-tarunima">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="flex items-center max-w-full mx-auto text-sm font-tarunima whitespace-nowrap">
          <Link href="/" className="transition-colors shrink-0 hover:text-orange-200">
            <Home size={16} />
          </Link>

          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="transition-colors hover:text-orange-200">
            গ্রন্থাগার
          </Link>
           <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/series" className="transition-colors hover:text-orange-200 shrink-0">
            সিরিজ
          </Link>          
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="flex items-center gap-2 font-medium">
            {seriesTitle}
          </span>
        </div>
      </nav>

      {/* মূল কন্টেন্ট */}
      <div className="px-3 py-6 mx-auto max-w-7xl">
        <header className="pb-3 mb-6 border-b border-orange-200">
          <h2 className="text-2xl font-bold text-center text-gray-800 md:text-3xl font-sabrina">
            {seriesTitle}
          </h2>
          <p className="mt-2 italic text-center text-gray-500">
            {books.length > 0 
              ? `এই সিরিজে মোট ${toBengaliNumber(books.length)}টি বই রয়েছে` 
              : "এই সিরিজে বর্তমানে কোনো বই নেই"}
          </p>
        </header>

        {books.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {books.map((book) => {
              const bookSlug = book.slug || book.id;
              return (
                <Link 
                  key={book.id || book.slug} 
                  href={`/book/${bookSlug}`} 
                  className="flex flex-col h-full group"
                >
                  <div className="relative aspect-2/3 overflow-hidden rounded shadow-sm bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md">
                    <Image 
                      src={book.cover || '/default-cover.jpg'} 
                      alt={book.title || 'বইয়ের প্রচ্ছদ'} 
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 transition-opacity opacity-0 bg-black/5 group-hover:opacity-100" />
                  </div>
                  
                  <div className="mt-2 text-center">
                    <h3 className="text-base font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 font-tarunima">
                      {book.author || 'অজানা লেখক'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-orange-100 border-dashed rounded-2xl">
            <BookOpen size={48} className="mx-auto mb-4 text-orange-200" />
            <p className="text-lg italic text-gray-400">দুঃখিত, এই বিভাগে কোনো বই খুঁজে পাওয়া যায়নি।</p>
            <Link href="/books" className="inline-block mt-6 font-medium text-emerald-600 hover:underline">
              সকল বই দেখুন
            </Link>
          </div>
        )}
      </div>
    </main>
  );
};

export default SeriesView;