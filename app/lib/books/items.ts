// app/lib/books/items.ts
import type { FrontmatterData } from '@/app/lib/frontmatter';
import { loadSlugManifest, readTextFromR2 } from './r2';

const ITEMS_MANIFEST_KEY = '_manifest/items-index.json';

export interface LibraryItemEntry {
  itemType: string;
  itemTypeSlug: string;
  title: string;
  slug?: string;
  titleSlug: string;
  bookTitle: string;
  bookSlug: string;
  author: string;
  authorSlug: string;
  href: string;
  r2Key: string; // 🔹 content-এর বদলে এখন শুধু R2 key রাখা হয় — প্রয়োজনে on-demand fetch হবে
  frontmatter: FrontmatterData;
}

let cachedItems: LibraryItemEntry[] | null = null;

/**
 * প্রি-বিল্ট items manifest পড়ে (আগে fs দিয়ে প্রতিটা .md ফাইল রিকার্সিভ স্ক্যান হতো)
 */
export async function getAllLibraryItems(forceRefresh = false): Promise<LibraryItemEntry[]> {
  await loadSlugManifest();
  if (cachedItems && !forceRefresh) return cachedItems;

  const raw = await readTextFromR2(ITEMS_MANIFEST_KEY);
  if (!raw) return [];

  try {
    cachedItems = JSON.parse(raw);
    return cachedItems!;
  } catch (err) {
    console.error('items manifest পার্স করতে ব্যর্থ:', err);
    return [];
  }
}

/**
 * নির্দিষ্ট Item Type এবং Title Slug দিয়ে সিঙ্গেল আইটেম ডাটা রিড করা
 * (এখন content আলাদা R2 কল দিয়ে on-demand fetch হয়)
 */
export async function getItemByParams(itemSlug: string, titleSlug: string) {
  const allItems = await getAllLibraryItems();

  const decodedTargetItemSlug = decodeURIComponent(itemSlug).trim().toLowerCase();
  const decodedTargetTitleSlug = decodeURIComponent(titleSlug).trim();
  const lowerTargetTitleSlug = decodedTargetTitleSlug.toLowerCase();

  const currentIndex = allItems.findIndex((item) => {
    const currentItemTypeSlug = (item.itemTypeSlug || '').trim().toLowerCase();
    const currentTitleSlug = (item.titleSlug || '').trim();
    const currentTitleSlugLower = currentTitleSlug.toLowerCase();
    const currentFrontmatterSlug = (item.slug || '').trim();

    const isTypeMatch = currentItemTypeSlug === decodedTargetItemSlug;
    const isTitleMatch =
      currentTitleSlug === decodedTargetTitleSlug ||
      currentTitleSlugLower === lowerTargetTitleSlug ||
      currentFrontmatterSlug === decodedTargetTitleSlug;

    return isTypeMatch && isTitleMatch;
  });

  if (currentIndex === -1) return null;

  const currentItem = allItems[currentIndex];

  // 🔹 এখন প্রকৃত কনটেন্ট R2 থেকে on-demand fetch হচ্ছে
  const raw = await readTextFromR2(currentItem.r2Key);
  const content = raw ? raw : '';

  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  return {
    item: { ...currentItem, content },
    navigation: {
      prev: prevItem ? { title: prevItem.title, href: prevItem.href } : null,
      next: nextItem ? { title: nextItem.title, href: nextItem.href } : null,
    },
  };
}