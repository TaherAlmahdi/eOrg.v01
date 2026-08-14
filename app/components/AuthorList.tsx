import type { FC } from "react";
import { getAllBooks, type Book } from "@/app/lib/books"; 
import { CONTENT_REGISTRY, getSlug, getAuthorSlugFromTitle } from "@/app/lib/content/core/registry";
import { AuthorListView } from "./AuthorListView";

interface AuthorListProps {
  sortBy?: "alphabetical" | "count";
  limit?: number;
}

const AuthorList: FC<AuthorListProps> = async ({ sortBy, limit }) => {
  const allBooks = await getAllBooks();
  const authorMap = new Map<string, { name: string; slug: string; count: number }>();

  // যেকোনো মানকে সেফলি String Array-তে রূপান্তর করার হেলপার ফাংশন
  const normalizeNames = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  };

  allBooks.forEach((book: Book) => {
    // ১. টাইপ-সেফ উপায়ে author, translator, এবং editor—তিনটি ফিল্ড থেকেই নামগুলো একত্রিত করা
    const rawAuthors = [
      ...normalizeNames(book.author),
      ...normalizeNames(book.translator),
      ...normalizeNames(book.editor),
    ];

    // ২. একটি বইয়ে একাধিক ভূমিকায় একই ব্যক্তির নাম থাকলে তা ফিল্টার করে ইউনিক রাখা
    const uniqueContributors = Array.from(new Set(rawAuthors));

    // ৩. প্রতিটি ব্যক্তির জন্য কাউন্ট ও ডেটা আপডেট করা
    uniqueContributors.forEach((rawAuthor) => {
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
  });

  const effectiveSortBy = sortBy || (limit ? "count" : "alphabetical");

  const sortedAuthors = Array.from(authorMap.values()).sort((a, b) => {
    if (effectiveSortBy === "count") {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name, "bn", { sensitivity: "base" });
  });

  const authors = limit ? sortedAuthors.slice(0, limit) : sortedAuthors;

  return (
    <div className="relative w-full h-auto">
      <div className="relative z-20 w-full max-w-none mx-auto">
        <AuthorListView
          authors={authors}
          isHomePage={!!limit}
          totalAuthorsCount={authorMap.size}
        />
      </div>
    </div>
  );
};

export default AuthorList;