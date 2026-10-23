// app/lib/content/core/registry.ts
//
// Slugs are written in registry/slug-data.ts (Bengali name -> slug) and reach the site through
// _manifest/slugs.json (see registry/slug-store.ts). The helpers below read from that store.

import { findName, slugOf, type SlugCategory } from "@/app/lib/content/core/registry/slug-store";
import { normalizeBanglaText, toUrlSlug } from "@/app/lib/content/core/registry/slug";

export * from "@/app/lib/content/core/registry/items";
export * from "@/app/lib/content/core/registry/slug";
export { findName, findSlug, slugOf } from "@/app/lib/content/core/registry/slug-store";

export const CONTENT_REGISTRY = {
  labels: {
    author: "লেখক",
    genre: "ঘরানা",
    tags: "শ্রেণী",
    volume: "গ্রন্থখণ্ড",
    chapter: "অধ্যায় বা পরিচ্ছেদ",
    series: "সিরিজ",
    books: "বই",
  } as Record<string, string>,
};

export type RegistryCategory = "authors" | "genres" | "tags" | "series" | "books";

/** Kept for existing callers; same as toUrlSlug. */
export const slugify = toUrlSlug;

/**
 * Slug for a Bengali name: the one written in the slug registry/manifest,
 * otherwise the slugified Bengali name itself.
 */
export function getSlug(type: RegistryCategory, banglaText: string): string {
  if (!banglaText) return "others";
  const cleaned = normalizeBanglaText(banglaText).trim();
  return slugOf(type as SlugCategory, cleaned) || cleaned;
}

const titleFromSlug = (category: SlugCategory, slug: string): string => {
  if (!slug) return "";
  const decoded = decodeURIComponent(slug);
  return findName(category, decoded) || decoded;
};

/** Bengali genre name from a URL slug (English or Bengali). */
export function getGenreTitle(slug: string): string {
  return titleFromSlug("genres", slug);
}

/** Bengali series title from a URL slug. */
export function getSeriesTitle(slug: string): string {
  return titleFromSlug("series", slug);
}

/** Bengali author name from a URL slug. */
export function getAuthorTitle(slug: string): string {
  return titleFromSlug("authors", slug);
}

/** Bengali book name from a URL slug. */
export function getBookTitle(slug: string): string {
  return titleFromSlug("books", slug);
}

/** Slug of an author (translators and editors too) from the Bengali name. */
export function getAuthorSlugFromTitle(authorName: string): string | undefined {
  if (!authorName) return undefined;
  return getSlug("authors", authorName);
}

/**
 * লেবেল অনুবাদের ফাংশন
 */
export function getLabelTranslation(key: string): string {
  const labels: Record<string, string> = {
    ...CONTENT_REGISTRY.labels,
    publisher: "প্রকাশক",
    published: "প্রকাশকাল",
  };

  return labels[key] || key;
}