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

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

const AuthorList = async () => {
  const allBooks = await getAllBooks();
  const authorMap = new Map<string, { name: string; slug: string; count: number }>();

  allBooks.forEach((book) => {
    const rawAuthor = book.author?.trim();
    if (!rawAuthor) return;

    const authorSlug = getAuthorSlugFromTitle(rawAuthor) || getSlug("authors", rawAuthor);
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

  const authors = Array.from(authorMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "bn", { sensitivity: "base" })
  );

  return (
    <div className="relative w-full h-auto">
      <div className="relative z-20 w-full max-w-none mx-auto">
        {/* টাইটেল হেডার */}
        <div className="flex justify-center mb-5 mt-5">
          <div className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded bg-teal-50/90 text-[#008080] border border-teal-100 shadow-xs text-center backdrop-blur-md">
            <Users size={24} className="shrink-0 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">সম্মানিত</span> লেখক <span className="text-[#cc7a00]">তালিকা</span>
            </h1>
          </div>
        </div>

        {/* বর্ণানুক্রমে সাজানো লেখক তালিকা - Grid Layout */}
        {authors.length === 0 ? (
          <div className="text-center p-8 bg-white/80 rounded text-gray-600 w-full">
            কোনো লেখকের তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          /* p-2 প্যাডিং হোভার শ্যাডোকে কাটার হাত থেকে রক্ষা করবে */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-2">
            {authors.map(({ slug, name, count }) => (
              <Link
                key={slug}
                href={`https://library.eduliture.org/${slug}`}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded bg-white/90 text-[#008080] border border-teal-100 shadow-sm transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 group cursor-pointer w-full"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-white transition-colors duration-300 shrink-0">
                    <User className="w-5 h-5 shrink-0" />
                  </div>
                  <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-base font-semibold leading-snug font-tarunima truncate transition-colors">
                    {name}
                  </h3>
                </div>

                <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-2 py-1 rounded text-xs font-semibold">
                  <BookOpen size={13} className="shrink-0" />
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