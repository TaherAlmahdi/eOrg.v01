import React from "react";
import { getAllLibraryItems } from "@/app/lib/books";
import { ITEM_REGISTRY, getItemSlug } from "@/app/lib/content/core/registry/items";
import ItemViewClient from "./ItemViewClient";

// ইনডেক্স সিগনেচারসহ সঠিক লাইব্রেরি আইটেম টাইপ
interface LibraryItem {
  title?: string | { name: string };
  href?: string;
  bookTitle?: string | { name: string };
  book?: string;
  bookHref?: string;
  bookSlug?: string;
  author?: string | { name: string };
  authorSlug?: string;
  author_slug?: string;
  item?: string | string[] | { title?: string; name?: string };
  items?: string | string[];
  itemType?: string | string[];
  itemTypeSlug?: string;
  slugsArray?: string[];
  [key: string]: unknown;
}

interface ItemViewProps {
  slug: string;
  authorSlug?: string;
  slugsArray?: string[]; // ক্যাচ-অল স্লাগ অ্যারে রিসিভ করার জন্য
}

const extractFieldText = (field: any, fallback: string = "—"): string => {
  if (!field) return fallback;
  if (typeof field === "string") return field.trim() || fallback;
  if (typeof field === "object" && field !== null) {
    return field.name || field.title || fallback;
  }
  return fallback;
};

const extractItemSlugsFromEntry = (entry: LibraryItem): string[] => {
  const rawValues: any[] = [];
  const candidates = [entry.item, entry.items, entry.itemType, entry.itemTypeSlug];

  candidates.forEach((cand) => {
    if (Array.isArray(cand)) rawValues.push(...cand);
    else if (cand) rawValues.push(cand);
  });

  return rawValues.map((val) => {
    if (typeof val === "string") return getItemSlug(val);
    if (typeof val === "object" && val !== null) {
      return getItemSlug(val.name || val.title || val.item || "");
    }
    return "";
  }).filter(Boolean);
};

export default async function ItemView({ slug, authorSlug, slugsArray = [] }: ItemViewProps) {
  // slugsArray থেকে লেয়ারগুলো আলাদা করে নেওয়া যেতে পারে (যদি প্রয়োজন হয়)
  // যেমন: slugsArray[0] -> প্রকরণ (category), slugsArray[1] -> মূল আইটেম, slugsArray[2] -> পাতা নম্বর
  const categoryType = slugsArray.length > 1 ? slugsArray[0] : null;

  // টাইপ কাস্টিং করে নিশ্চিত করা হলো যাতে টাইপ কমপ্যাটিবল থাকে
  const allLibraryItems = (await getAllLibraryItems()) as unknown as LibraryItem[];

  const rawSlug = decodeURIComponent(slug).trim();
  const targetSlug = getItemSlug(rawSlug);
  const displayTitle = ITEM_REGISTRY[targetSlug]?.name || rawSlug || 'সকল আইটেম';

  const filteredItems = allLibraryItems.filter((entry) => {
    if (authorSlug) {
      const fileAuthorSlug = getItemSlug(
        entry.authorSlug || entry.author_slug || extractFieldText(entry.author, "")
      );
      if (fileAuthorSlug !== authorSlug.toLowerCase()) return false;
    }

    // যদি প্রকরণ বা ক্যাটাগরি থাকে, তবে সেটি ফিল্টারে যুক্ত করতে পারেন
    if (categoryType && entry.category && entry.category !== categoryType) {
      return false;
    }

    // যদি slug খালি থাকে (যেমন /items পেজ), তবে সব আইটেম রিটার্ন করবে
    if (!targetSlug) return true;

    const itemSlugs = extractItemSlugsFromEntry(entry);
    return itemSlugs.includes(targetSlug);
  });

  return (
    <ItemViewClient 
      initialItems={filteredItems} 
      displayTitle={displayTitle} 
      slugsArray={slugsArray}
    />
  );
}