// app/lib/content/libraryLoader.ts

import path from "node:path";
import { loadContent } from "./core/loader";
import { parseLiteratureBooks, filterBooksBySubdomain } from "./core/factory";
import type { LiteratureBook } from "./core/types";

// আপনার বর্তমান প্রজেক্টের রুট 'content' ফোল্ডারের সঠিক পাথ নির্ধারণ (Vercel Production Safe)
const CONTENT_DIRECTORY = path.join(process.cwd(), "content");

/**
 * আপনার 'content' ফোল্ডার থেকে সব বই বা সাহিত্যের ফাইল একসাথে লোড করার সেন্ট্রাল ফাংশন
 */
export async function getAllLibraryBooks(): Promise<LiteratureBook[]> {
  // আমাদের কোর লোডার দিয়ে কাঁচা ফাইল রিড করা
  const rawDocs = await loadContent(CONTENT_DIRECTORY);
  
  // আমাদের সেন্ট্রাল ফ্যাক্টরি দিয়ে স্ল্যাগ, জনরা ও বাংলা পরিভাষাসহ প্রসেস করা
  return parseLiteratureBooks(rawDocs);
}

/**
 * ১. নির্দিষ্ট সাবডোমেনের জন্য সব বইয়ের তালিকা পেতে (যেমন: bankim, library বা rabindra)
 * এটি আপনার সাবডোমেন ভিত্তিক পেজগুলোতে ডেটা পাঠাবে
 */
export async function getBooksBySubdomain(subdomain: string): Promise<LiteratureBook[]> {
  const allBooks = await getAllLibraryBooks();
  return filterBooksBySubdomain(allBooks, subdomain);
}

/**
 * ২. ইউআরএল স্ল্যাগ অনুযায়ী নির্দিষ্ট একটি বই বা অধ্যায়ের সম্পূর্ণ কন্টেন্ট খুঁজে বের করতে
 * উদাহরণ: স্ল্যাগ 'durgeshnandini/v01/c01' এবং সাবডোমেন 'bankim' হলে সেই নির্দিষ্ট অধ্যায়টি দেবে
 */
export async function getBookBySlug(subdomain: string, slug: string): Promise<LiteratureBook | null> {
  const booksInSubdomain = await getBooksBySubdomain(subdomain);
  
  // ইউজার যে স্ল্যাগ দিয়ে সার্চ করছেন (যেমন: durgeshnandini/v01/c01) তার সাথে মেলানো
  const targetBook = booksInSubdomain.find((book) => book.slug === slug.toLowerCase().trim());
  
  return targetBook || null;
}