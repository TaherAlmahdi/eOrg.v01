import type { FC } from "react";
import { getAllBooks } from "@/app/lib/books"; 
import { CONTENT_REGISTRY, getSlug } from "@/app/lib/content/core/registry";
import { GenreListView } from "./GenreListView";
import { Users, Library, Layers } from 'lucide-react';

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

const parseGenreField = (item: any): string[] => {
  const result: string[] = [];
  if (!item) return result;
  if (typeof item.genre === 'string' && item.genre.trim()) result.push(item.genre.trim());
  else if (Array.isArray(item.genre)) item.genre.forEach((g: any) => typeof g === 'string' && g.trim() && result.push(g.trim()));
  if (typeof item.genres === 'string' && item.genres.trim()) result.push(item.genres.trim());
  else if (Array.isArray(item.genres)) item.genres.forEach((g: any) => typeof g === 'string' && g.trim() && result.push(g.trim()));
  return result;
};

const collectAllGenresFromBook = (book: any): string[] => {
  const genreSet = new Set<string>();
  parseGenreField(book).forEach((g) => genreSet.add(g));

  const nestedArrays = [book.directChapters, book.chapters, book.stories, book.items, book.articles, book.contents];
  nestedArrays.forEach((arr) => {
    if (Array.isArray(arr)) arr.forEach((subItem: any) => parseGenreField(subItem).forEach((g) => genreSet.add(g)));
  });

  if (Array.isArray(book.volumes)) {
    book.volumes.forEach((vol: any) => {
      parseGenreField(vol).forEach((g) => genreSet.add(g));
      const volSubArrays = [vol.chapters, vol.stories, vol.items, vol.directChapters];
      volSubArrays.forEach((arr) => {
        if (Array.isArray(arr)) arr.forEach((subItem: any) => parseGenreField(subItem).forEach((g) => genreSet.add(g)));
      });
    });
  }

  return Array.from(genreSet);
};

interface GenreListProps {
  sortBy?: "alphabetical" | "count";
  limit?: number;
}

const GenreList: FC<GenreListProps> = async ({ sortBy, limit }) => {
  const allBooks = await getAllBooks();

  const authorSet = new Set<string>();
  const genreMap = new Map<string, { label: string; slug: string; rawGenre: string; count: number }>();

  allBooks.forEach((book: any) => {
    if (book.author) authorSet.add(book.author);

    const bookGenres = collectAllGenresFromBook(book);
    const finalGenres = bookGenres.length > 0 ? bookGenres : ['অন্যান্য'];

    finalGenres.forEach((rawGenre) => {
      const cleanGenre = rawGenre.trim();
      if (!cleanGenre) return;

      const genreSlug = getSlug("genres", cleanGenre);

      if (genreMap.has(genreSlug)) {
        const current = genreMap.get(genreSlug)!;
        genreMap.set(genreSlug, { ...current, count: current.count + 1 });
      } else {
        const label = CONTENT_REGISTRY.genres[genreSlug] || cleanGenre;
        genreMap.set(genreSlug, { label, slug: genreSlug, rawGenre: cleanGenre, count: 1 });
      }
    });
  });

  const effectiveSortBy = sortBy || (limit ? "count" : "alphabetical");

  const sortedGenres = Array.from(genreMap.values()).sort((a, b) => {
    if (effectiveSortBy === "count") {
      return b.count - a.count;
    }
    return a.label.localeCompare(b.label, "bn", { sensitivity: "base" });
  });

  const genres = limit ? sortedGenres.slice(0, limit) : sortedGenres;

  return (
    <div className="relative w-full h-auto overflow-x-clip">
      <div className="relative z-20 w-full max-w-none mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-5 w-full p-2">
          <div className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-md rounded border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded bg-teal-50 text-[#008080] border border-teal-100/50">
                <Users size={32} className="shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">আমাদের পরিবারে</p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  সম্মানিত লেখক <span className="text-[#008080] font-black text-2xl md:text-3xl mx-1">{toBengaliNumber(authorSet.size)}</span> জন
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-md rounded border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded bg-amber-50 text-[#cc7a00] border border-amber-100/50">
                <Library size={32} className="shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">সংগ্রহশালায়</p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  আমাদের প্রকাশিত গ্রন্থ সংখ্যা <span className="text-[#cc7a00] font-black text-2xl md:text-3xl mx-1">{toBengaliNumber(allBooks.length)}</span> টি
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 প্রপস থেকে getIcon বাদ দেওয়া হয়েছে */}
        <GenreListView
          genres={genres}
          isHomePage={!!limit}
          totalGenresCount={genreMap.size}
        />
      </div>
    </div>
  );
};

export default GenreList;