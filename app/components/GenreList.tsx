import type { FC } from "react";
import { getAllBooks } from "@/app/lib/books"; 
import { CONTENT_REGISTRY, getSlug } from "@/app/lib/content/core/registry";
import { GenreListView } from "./GenreListView";

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

  const contributorSet = new Set<string>();
  const seriesSet = new Set<string>();
  const genreMap = new Map<string, { label: string; slug: string; rawGenre: string; count: number }>();

  allBooks.forEach((book: any) => {
    // 🔹 লেখক, অনুবাদক ও সম্পাদকদের ইউনিকভাবে যুক্ত করা হচ্ছে
    if (typeof book.author === 'string' && book.author.trim()) {
      contributorSet.add(book.author.trim());
    }
    if (typeof book.translator === 'string' && book.translator.trim()) {
      contributorSet.add(book.translator.trim());
    }
    if (typeof book.editor === 'string' && book.editor.trim()) {
      contributorSet.add(book.editor.trim());
    }

    // 🔹 সিরিজের ইউনিক কাউন্ট সংগ্রহ
    const rawSeries = book.Series || book.series;
    if (rawSeries) {
      const seriesList = Array.isArray(rawSeries) ? rawSeries : [rawSeries];
      seriesList.forEach((s) => {
        if (typeof s === 'string' && s.trim()) {
          seriesSet.add(s.trim());
        }
      });
    }

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
      <div className="relative z-20 w-full mx-auto max-w-none">


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