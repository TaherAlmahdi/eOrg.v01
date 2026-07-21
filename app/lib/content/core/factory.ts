// app/lib/content/core/factory.ts

import path from "node:path";
import type { LoadedDocument } from "./loader";
import type { LiteratureBook } from "./types";
import { getSlug, getLabelTranslation } from "./registry";

/**
 * ফাইলের নাম বা ফ্রন্টমেটারের 'title_slug' থেকে ক্লিন ইউআরএল স্ল্যাগ তৈরি করার লজিক
 * উদাহরণ: durgeshnandini-v01-c01.md -> durgeshnandini/v01/c01
 */
export function createSafeSlug(document: LoadedDocument): string {
  const frontMatter = document.frontMatter;

  // ১. ফ্রন্টমেটারে ম্যানুয়ালি 'title_slug' দেওয়া থাকলে সেটাই ফার্স্ট প্রায়োরিটি
  if (typeof frontMatter.title_slug === "string" && frontMatter.title_slug.trim() !== "") {
    return frontMatter.title_slug.trim().toLowerCase();
  }

  // ২. ফলব্যাক: ফাইলের নাম থেকে ড্যাশ বা আন্ডারস্কোরকে স্ল্যাশে কনভার্ট করা
  const baseName = path.basename(document.fileName, path.extname(document.fileName));
  return baseName.replace(/[-_]/g, "/").toLowerCase().trim();
}

/**
 * আপনার সুনির্দিষ্ট ফরম্যাটে নিখুঁত এসইও টাইটেল তৈরি করার সেন্ট্রাল লজিক
 * ফরম্যাট: পরিচ্ছেদ | খণ্ড | বইয়ের নাম ❀ এডুলিচার
 */
export function generateSEOTitle(book: LiteratureBook): string {
  const parts: string[] = [];
  if (book.chapter) parts.push(book.chapter.trim());
  if (book.volume) parts.push(book.volume.trim());
  if (book.title) parts.push(book.title.trim());
  
  return parts.length > 0 ? `${parts.join(" | ")} ❀ এডুলিচার` : "এডুলিচার";
}

/**
 * কাঁচা মেটাডাটাকে প্রসেস করে সেন্ট্রাল ডিকশনারির স্ল্যাগ এবং বাংলা পরিভাষাসহ অবজেক্টে রূপান্তর
 */
export function parseLiteratureBooks(documents: LoadedDocument[]): LiteratureBook[] {
  return documents.map((doc) => {
    const frontMatter = doc.frontMatter;
    const slug = createSafeSlug(doc);

    // ফ্রন্টমেটার থেকে বাংলা কন্টেন্ট ভ্যালুগুলো সংগ্রহ করা
    const author = typeof frontMatter.author === "string" ? frontMatter.author.trim() : "অজানা লেখক";
    const genre = typeof frontMatter.genre === "string" ? frontMatter.genre.trim() : "সাধারণ";
    const tags: string[] = Array.isArray(frontMatter.tags) ? frontMatter.tags.map((t: string) => t.trim()) : [];

    // ১. ইউআরএল এর জন্য রেজিস্ট্রি থেকে স্বয়ংক্রিয়ভাবে ইংরেজি স্ল্যাগ সংগ্রহ করা (`getSlug` ব্যবহার করে)
    const authorSlug = getSlug("authors", author);
    const genreSlug = getSlug("genres", genre);
    const tagSlugs = tags.map((tag) => getSlug("tags", tag));

    // ২. পেজে প্রদর্শনের জন্য রেজিস্ট্রি থেকে খাঁটি বাংলা পরিভাষা (Labels) সংগ্রহ করা
    const authorLabel = getLabelTranslation("author");
    const genreLabel = getLabelTranslation("genre");
    const tagsLabel = getLabelTranslation("tags");

    return {
      id: typeof frontMatter.id === "string" ? frontMatter.id.trim() : `book-${slug.replace(/\//g, "-")}`,
      slug,
      title: typeof frontMatter.title === "string" ? frontMatter.title.trim() : slug,
      content: doc.markdown,
      volume: frontMatter.volume,
      chapter: frontMatter.chapter,
      author,
      authorSlug,
      genre,
      genreSlug,
      tags,
      tagSlugs,
      authorLabel,
      genreLabel,
      tagsLabel,
      subdomains: Array.isArray(frontMatter.subdomains)
        ? frontMatter.subdomains.map((s: string) => s.toLowerCase().trim())
        : ["library"],
      draft: !!frontMatter.draft,
      document: doc,
    };
  });
}

/**
 * নির্দিষ্ট সাবডোমেন অনুযায়ী বইয়ের তালিকা ছেঁকে বের করার ফিল্টার ইউটিলিটি
 */
export function filterBooksBySubdomain(books: LiteratureBook[], currentSubdomain: string): LiteratureBook[] {
  const target = currentSubdomain.toLowerCase().trim();
  return books.filter((book) => !book.draft && book.subdomains.includes(target));
}