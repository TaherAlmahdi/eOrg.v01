import type { FC } from "react";
import Link from "next/link";
import { getAllBooks } from "@/app/lib/books"; 
import { CONTENT_REGISTRY, getSlug, getAuthorSlugFromTitle } from "@/app/lib/content/core/registry";
import { 
  Sparkles, 
  BookOpen, 
  Users, 
  Library, 
  User 
} from 'lucide-react';

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

const AuthorList = async () => {
  const allBooks = await getAllBooks();

  const authorMap = new Map<string, { name: string; slug: string; count: number }>();

  allBooks.forEach((book) => {
    const rawAuthor = book.author?.trim();
    if (!rawAuthor) return;

    // ১. registry.ts থেকে স্লাগ বের করা
    const authorSlug = getAuthorSlugFromTitle(rawAuthor) || getSlug("authors", rawAuthor);

    // ২. প্রদর্শনের জন্য বাংলা নাম উদ্ধার করা
    const displayName = CONTENT_REGISTRY.authors[authorSlug] || rawAuthor;

    if (authorMap.has(authorSlug)) {
      const current = authorMap.get(authorSlug)!;
      authorMap.set(authorSlug, { ...current, count: current.count + 1 });
    } else {
      authorMap.set(authorSlug, {
        name: displayName,
        slug: authorSlug,
        count: 1,
      });
    }
  });

  // ৩. বাংলা বর্ণানুক্রম অনুযায়ী (অ, আ, ই...) লেখকদের নাম সোর্ট করা
  const authors = Array.from(authorMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "bn", { sensitivity: "base" })
  );

  const totalAuthors = authors.length;
  const totalBooks = allBooks.length;

  return (
    <div
      className="relative w-full h-auto overflow-x-clip"    
    >
      <div className="relative z-20 w-full max-w-none mx-auto">
        {/* টাইটেল হেডার */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-2 rounded bg-teal-50/90 text-[#008080] mb-8 border border-teal-100 shadow-xs text-center backdrop-blur-md">
            <Users size={24} className="shrink-0 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">সম্মানিত</span> লেখক <span className="text-[#cc7a00]">তালিকা</span>
            </h1>
          </div>
        </div>

        {/* বর্ণানুক্রমে সাজানো লেখক তালিকা */}
        {authors.length === 0 ? (
          <div className="text-center p-8 bg-white/80 rounded-xl text-gray-600 w-full">
            কোনো লেখকের তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-start items-stretch relative z-20 w-full">
            {authors.map(({ slug, name, count }) => (
              <Link
                key={slug}
                href={`https://library.eduliture.org/author/${slug}`}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded mb-1 bg-white/90 text-[#008080] border border-teal-100 shadow-sm transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-lg hover:border-teal-300 hover:scale-[1.02] shrink-0 grow basis-full sm:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-0.75rem)] xl:basis-[calc(25%-0.75rem)] 2xl:basis-[calc(20%-0.75rem)] max-w-full group cursor-pointer overflow-hidden"
              >
                {/* বামপাশে লেখকের সিঙ্গেল ইউজার আইকন ও নাম */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-white transition-colors duration-300 shrink-0">
                    <User className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                  </div>
                  <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-base md:text-lg font-semibold leading-snug font-tarunima truncate transition-colors">
                    {name}
                  </h3>
                </div>

                {/* ডানপাশে রাইট এলাইন্ড গ্রন্থ সংখ্যা */}
                <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                  <BookOpen size={14} className="shrink-0" />
                  <span>{toBengaliNumber(count)} টি</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorList;