// app/components/GenreView.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, BookOpen } from "lucide-react";
import { getLibraryBooks, Book } from '@/app/lib/books';
import { getGenreTitle } from '@/app/lib/content/core/registry';

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string) => {
  const englishToBengali: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().replace(/\d/g, (digit) => englishToBengali[digit] || digit);
};

interface GenreViewProps {
  slug: string;
  authorSlug?: string;
}

export default async function GenreView({ slug, authorSlug }: GenreViewProps) {
  const decodedSlug = slug.toLowerCase();
  
  // রেজিস্ট্রি থেকে বাংলা ঘরানার নাম বের করা (যেমন: novel -> উপন্যাস)
  const targetBengaliGenre = getGenreTitle(decodedSlug) || slug;
  const targetStr = String(targetBengaliGenre).trim().toLowerCase();

  // কেন্দ্রীয় বই লোডার ব্যবহার করে কন্টেন্ট আনা (authorSlug থাকলে কেবল সেই সাবডোমেনের বই আসবে)
  const { latestBooks } = await getLibraryBooks(authorSlug);

  // ফিল্টারিং লজিক (ঠিক আপনার অরিজিনাল পেজের মতো)
  const filteredBooks = latestBooks.filter((book: Book) => {
    const rawGenres = book.genres || (book as unknown as Record<string, unknown>).genre;
    if (!rawGenres) return false;

    if (Array.isArray(rawGenres)) {
      return rawGenres.some((g: unknown) => String(g).trim().toLowerCase() === targetStr);
    }
    if (typeof rawGenres === 'string') {
      return String(rawGenres).trim().toLowerCase() === targetStr;
    }
    return false;
  });

  // সর্টিং লজিক: প্রথমে 'প্রথম প্রকাশনার সাল' (first_published), না থাকলে 'সাইটে যুক্তের সাল' (published)
  filteredBooks.sort((a: Book, b: Book) => {
    const rawA = (a as unknown as Record<string, unknown>).first_published || a.published;
    const rawB = (b as unknown as Record<string, unknown>).first_published || b.published;

    const pubA = rawA ? parseInt(String(rawA), 10) || new Date(String(rawA)).getFullYear() : Infinity;
    const pubB = rawB ? parseInt(String(rawB), 10) || new Date(String(rawB)).getFullYear() : Infinity;

    if (pubA !== pubB) {
      return pubA - pubB;
    }
    return (a.title || '').localeCompare(b.title || '', 'bn');
  });

  return (
    <main className="bg-[#fdfcf8] min-h-screen font-tarunima">
      {/* নেভিগেশন বার */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="max-w-full mx-auto text-sm font-tarunima flex items-center whitespace-nowrap">
          <Link href="/" className="shrink-0"><Home size={16} /></Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="hover:text-orange-200">গ্রন্থাগার</Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <span className="flex items-center gap-2 font-medium">
            {targetBengaliGenre}
          </span>
        </div>
      </nav>

      {/* মূল কন্টেন্ট ডোমেন */}
      <div className="max-w-8xl mx-auto py-4 px-3">
        <header className="mb-6 border-b border-orange-200 pb-3">
          <h2 className="text-2xl text-center md:text-3xl font-bold font-sabrina text-gray-800">
            ঘরানা: {targetBengaliGenre}
          </h2>
          <p className="text-gray-500 text-center mt-2 italic">
            {filteredBooks.length > 0 
              ? `এই ঘরানায় মোট ${toBengaliNumber(filteredBooks.length)}টি বই রয়েছে` 
              : "এই ঘরানায় বর্তমানে কোনো বই নেই"}
          </p>
        </header>

        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4">
            {filteredBooks.map((book: Book) => (
              <Link 
                key={book.id || book.slug} 
                href={`/book/${book.id || book.slug}`} 
                className="group flex flex-col h-full"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded shadow-sm bg-white border border-gray-100 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:shadow-md">
                  <Image 
                    src={book.cover || book.cover_image || '/default-cover.jpg'} 
                    alt={book.title || 'বইয়ের প্রচ্ছদ'} 
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="mt-2 text-center">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-tarunima">
                    {book.author || 'অজানা লেখক'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-orange-100 rounded-2xl">
            <BookOpen size={48} className="mx-auto text-orange-200 mb-4" />
            <p className="text-gray-400 text-lg italic">দুঃখিত, এই বিভাগে কোনো বই খুঁজে পাওয়া যায়নি।</p>
            <Link href="/books" className="mt-6 inline-block text-emerald-600 hover:underline font-medium">
              সকল বই দেখুন
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}