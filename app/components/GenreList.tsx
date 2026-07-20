// app/components/GenreList.tsx
import type { FC } from "react";
import { getAllLibraryBooks } from "../lib/content/libraryLoader";
import { Sparkles } from 'lucide-react';
// ১. জনরা অনুযায়ী আইকন ম্যাপিং ডিকশনারি
// আপনার factory.ts-এ যে জনরাগুলো ডিফাইন করা আছে (যেমন: 'novel', 'poetry', ইত্যাদি) তার সাথে মিলিয়ে আইকন সেট করুন
const GENRE_ICONS: Record<string, FC<{ className?: string }>> = {
  novel: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {/* উপন্যাস বা বইয়ের আইকন */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  poetry: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {/* কবিতা বা কলমের আইকন */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  essay: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {/* প্রবন্ধ বা ডকুমেন্টের আইকন */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  // ডিফল্ট আইকন: যদি নতুন কোনো জনরা আসে যার আইকন এখানে ডিফাইন করা নেই, তবে এটি দেখাবে
  default: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
};

const GenreList = async () => {
  // ২. লাইব্রেরি থেকে সব বইয়ের ডাটা একবারে তুলে আনা
  const allBooks = await getAllLibraryBooks();

  // ৩. ডাইনামিক্যালি ইউনিক জনরা এবং তাদের বাংলা লেবেল ছেঁকে নেওয়া
  const uniqueGenresMap = new Map<string, string>();
  
  allBooks.forEach((book) => {
    if (book.genre && book.genreLabel) {
      uniqueGenresMap.set(book.genre, book.genreLabel);
    }
  });

  // ম্যাপকে লুপ চালানোর সুবিধার্থে অ্যারে-তে রূপান্তর
  const genres = Array.from(uniqueGenresMap.entries()).map(([genre, genreLabel]) => ({
    genre,
    genreLabel,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
                <Sparkles size={28} className="shrink-0" />
                <h1 className="text-xl md:text-2xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
                  <span className="text-[#008080]">লাইব্রেরি</span> গ্রন্থ <span className="text-[#cc7a00]">বিন্যাস</span>
                </h1>
              </div>
            </div> 

      {/* রেস্পনসিভ গ্রিড লেআউট */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {genres.map(({ genre, genreLabel }) => {
          // ৪. অটোমেটিক আইকন সিলেকশন মেকানিজম
          const IconComponent = GENRE_ICONS[genre] || GENRE_ICONS.default;

          return (
            <div
              key={genre}
              className="flex flex-col items-center justify-center p-6 bg-white/50 backdrop-blur-xs rounded-xl border border-white/20 shadow-xs hover:shadow-md hover:bg-white/80 transition-all duration-300 text-center group cursor-pointer"
            >
              {/* উপরে থাকবে অটোমেটিক নির্বাচিত আইকন */}
              <IconComponent className="w-10 h-10 text-[#cc7a00] group-hover:scale-110 transition-transform duration-300 mb-3" />
              
              {/* নিচে থাকবে জনরার নাম বা বাংলা লেবেল */}
              <span className="text-sm md:text-base font-semibold text-gray-800 group-hover:text-[#cc7a00] transition-colors">
                {genreLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenreList;