// app/lib/books/singleItemExtract.ts
import type { FrontmatterData, FrontmatterValue } from '@/app/lib/frontmatter';
import matter from 'gray-matter'; // 🌟 ১. gray-matter ইমপোর্ট করা হলো
import { getAllLibraryItems } from './items';
import { readTextFromR2 } from './r2';

export interface SingleBookItem {
  slug: string;
  title: string;
  subtitle?: string;
  author?: string | string[];
  authorSlug?: string;
  bookTitle?: string;
  bookSlug?: string;
  itemType?: string;
  itemTypeSlug?: string;
  href?: string;
  translator?: string | string[];
  editor?: string | string[];
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  cover_image?: string;
  rawFrontmatter?: FrontmatterData;
  content: string;
  [key: string]: FrontmatterValue;
}

/**
 * 🛠️ হেল্পার: ফ্রন্টম্যাটারের item বা type ফিল্ড স্ট্রিং বা অবজেক্ট যাই হোক না কেন তা থেকে সঠিক নাম বা স্লাগ বের করা
 */
const resolveItemTypeString = (rawItem: FrontmatterValue): string => {
  if (!rawItem) return '';
  if (typeof rawItem === 'string') return rawItem.trim().toLowerCase();
  if (typeof rawItem === 'object' && rawItem !== null) {
    const val = rawItem.name || rawItem.title || rawItem.item || rawItem.type || '';
    return typeof val === 'string' ? val.trim().toLowerCase() : '';
  }
  return '';
};

export async function getItemsByItemType(targetItemType?: string) {
  const allLibraryItems = await getAllLibraryItems();

  if (!targetItemType) {
    return allLibraryItems.map((item) => ({
      slug: item.titleSlug,
      title: item.title,
      author: item.author,
      bookTitle: item.bookTitle,
      ...item.frontmatter,
    }));
  }

  const cleanTargetType = targetItemType.trim().toLowerCase();

  const filtered = allLibraryItems.filter((item) => {
    const type = resolveItemTypeString(item.itemType || item.frontmatter?.item);
    const typeSlug = resolveItemTypeString(item.itemTypeSlug || item.frontmatter?.itemSlug);

    return type === cleanTargetType || typeSlug === cleanTargetType || type.includes(cleanTargetType);
  });

  return filtered.map((item) => ({
    slug: item.titleSlug,
    title: item.title,
    author: item.author,
    bookTitle: item.bookTitle,
    ...item.frontmatter,
  }));
}

/**
 * যেকোনো স্লাগ দিয়ে সিঙ্গেল আইটেম খোঁজা
 */
export async function getBookBySlug(slug: string | string[]): Promise<SingleBookItem | null> {
  const rawSlug = Array.isArray(slug) ? slug.join('/') : slug;
  const decodedSlug = decodeURIComponent(rawSlug).trim();
  const lowerDecodedSlug = decodedSlug.toLowerCase().replace(/^\/+|\/+$/g, '');

  const slugSegments = decodedSlug.split('/').filter(Boolean);
  const allItems = await getAllLibraryItems();

  // প্রথমে সম্পূর্ণ পাথ দিয়ে নিখুঁত (Exact) ম্যাচ খোঁজা
  let matchedItem = allItems.find((entry) => {
    const href = entry.href ? entry.href.toLowerCase().replace(/^\/+|\/+$/g, '') : '';
    const cleanHref = href.replace(/^book\//, '');

    return cleanHref === lowerDecodedSlug || cleanHref.endsWith(`/${lowerDecodedSlug}`);
  });

  // যদি নিখুঁত পাথ ম্যাচ না মেলে এবং এটি একটিমাত্র সেগমেন্ট হয়, তবে সাধারণ স্লাগ বা ফাইল স্লাগ দিয়ে খুঁজি
  if (!matchedItem && slugSegments.length === 1) {
    const singleSlug = slugSegments[0].toLowerCase();
    matchedItem = allItems.find((entry) => {
      const tSlug = entry.titleSlug ? entry.titleSlug.trim().toLowerCase() : '';
      const fileSlug = entry.frontmatter?.slug ? String(entry.frontmatter.slug).trim().toLowerCase() : '';
      return tSlug === singleSlug || fileSlug === singleSlug;
    });
  }

  // যদি তখনও না মেলে, তবে শেষের অংশ দিয়ে ফ্লেক্সিবল ম্যাচ
  if (!matchedItem && slugSegments.length > 1) {
    const lastSegment = slugSegments[slugSegments.length - 1].toLowerCase();
    matchedItem = allItems.find((entry) => {
      const href = entry.href ? entry.href.toLowerCase() : '';
      return href.endsWith(`/${lastSegment}`);
    });
  }

  if (!matchedItem) return null;

  const raw = await readTextFromR2(matchedItem.r2Key);

  // 🌟 ২. gray-matter দিয়ে ফ্রন্টম্যাটার এবং বডি আলাদা করা হলো
  const parsed = matter(raw || '');
  const content = parsed.content; // এটি শুধু মূল লেখার অংশটুকু দেবে, ফ্রন্টম্যাটার নয়!

  return {
    slug: matchedItem.titleSlug,
    title: matchedItem.title,
    subtitle: matchedItem.frontmatter?.subtitle || '',
    author: matchedItem.author || matchedItem.frontmatter?.author || '',
    authorSlug: matchedItem.authorSlug,
    bookTitle: matchedItem.bookTitle,
    bookSlug: matchedItem.bookSlug,
    itemType: resolveItemTypeString(matchedItem.itemType || matchedItem.frontmatter?.item),
    itemTypeSlug: matchedItem.itemTypeSlug,
    href: matchedItem.href,
    translator: matchedItem.frontmatter?.translator || '',
    editor: matchedItem.frontmatter?.editor || '',
    meta_title: matchedItem.frontmatter?.meta_title || matchedItem.title,
    meta_description: matchedItem.frontmatter?.meta_description || '',
    og_image: matchedItem.frontmatter?.og_image || '',
    cover_image: matchedItem.frontmatter?.cover_image || '',
    rawFrontmatter: matchedItem.frontmatter,
    content, // ফ্রন্টম্যাটার বাদ দেওয়া পরিষ্কার বডি কন্টেন্ট
    ...matchedItem.frontmatter,
  };
}