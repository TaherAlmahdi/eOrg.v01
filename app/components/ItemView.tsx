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
  [key: string]: unknown; // এই লাইনটি ইনডেক্স সিগনেচার এরর দূর করবে
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

export default async function ItemView({ slug, authorSlug }: { slug: string; authorSlug?: string }) {
  // টাইপ কাস্টিং করে নিশ্চিত করা হলো যাতে টাইপ কমপ্যাটিবল থাকে
  const allLibraryItems = (await getAllLibraryItems()) as unknown as LibraryItem[];

  const rawSlug = decodeURIComponent(slug).trim();
  const targetSlug = getItemSlug(rawSlug);
  const displayTitle = ITEM_REGISTRY[targetSlug]?.name || rawSlug;

  const filteredItems = allLibraryItems.filter((entry) => {
    if (authorSlug) {
      const fileAuthorSlug = getItemSlug(
        entry.authorSlug || entry.author_slug || extractFieldText(entry.author, "")
      );
      if (fileAuthorSlug !== authorSlug.toLowerCase()) return false;
    }

    const itemSlugs = extractItemSlugsFromEntry(entry);
    return itemSlugs.includes(targetSlug);
  });

  return (
    <ItemViewClient 
      initialItems={filteredItems} 
      displayTitle={displayTitle} 
    />
  );
}