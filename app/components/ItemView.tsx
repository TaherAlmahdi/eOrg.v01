import React from "react";
import { getAllLibraryItems, type LibraryItemEntry } from "@/app/lib/books";
import { ITEM_REGISTRY, getItemSlug } from "@/app/lib/content/core/registry/items";
import ItemViewClient from "./ItemViewClient";

export type LibraryItem = LibraryItemEntry & {
  category?: string | string[];
  categorySlug?: string;
  prakaron?: string | string[];
  prakaronSlug?: string;
  [key: string]: unknown;
};

interface ItemViewProps {
  slug?: string;
  authorSlug?: string;
  slugsArray?: string[];
}

// বাংলা স্ট্রিং নরমালাইজেশন ও ক্লিনিং
const normalizeText = (text: string = ""): string => {
  if (!text) return "";
  return text
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase()
    .trim();
};

const extractFieldText = (field: unknown, fallback: string = ""): string => {
  if (!field) return fallback;
  if (typeof field === "string") return field.trim() || fallback;
  if (typeof field === "object" && field !== null) {
    const obj = field as Record<string, unknown>;
    return String(obj.name || obj.title || obj.slug || fallback).trim();
  }
  return fallback;
};

// লেখক সংক্রান্ত সকল ফিল্ড থেকে নিরাপদভাবে স্লাগ বা নাম এক্সট্র্যাক্ট করা
const extractAuthorValue = (entry: LibraryItem): string => {
  const authorData = entry.author;

  // ১. author যদি অবজেক্ট হয়
  if (typeof authorData === "object" && authorData !== null && !Array.isArray(authorData)) {
    const authorObj = authorData as Record<string, unknown>;
    return String(authorObj.slug || authorObj.name || "").trim();
  }

  // ২. author যদি অ্যারে হয়
  if (Array.isArray(authorData) && authorData.length > 0) {
    const first = authorData[0];
    if (typeof first === "object" && first !== null) {
      const firstObj = first as Record<string, unknown>;
      return String(firstObj.slug || firstObj.name || "").trim();
    }
    return String(first).trim();
  }

  // ৩. রুট লেভেলের authorSlug, author_slug অথবা সাধারণ স্ট্রিং
  const rawCandidate =
    (entry.authorSlug as string) ||
    (entry.author_slug as string) ||
    (typeof authorData === "string" ? authorData : "");

  return String(rawCandidate).trim();
};

// এন্ট্রি থেকে সব সম্ভাব্য প্রকরণ বা আইটেম স্লাগ/নাম বের করা
const extractItemSlugsFromEntry = (entry: LibraryItem): string[] => {
  const rawValues: unknown[] = [];
  
  const candidates = [
    entry.item,
    entry.items,
    entry.itemType,
    entry.itemTypeSlug,
    entry.prakaron,
    entry.prakaronSlug,
    entry.category,
    entry.categorySlug,
    entry.frontmatter?.prakaron,
    entry.frontmatter?.itemType,
  ];

  candidates.forEach((cand) => {
    if (Array.isArray(cand)) {
      rawValues.push(...cand);
    } else if (cand) {
      rawValues.push(cand);
    }
  });

  const resolvedSlugs = new Set<string>();

  rawValues.forEach((val) => {
    const textVal = extractFieldText(val);
    if (!textVal) return;

    // ১. হুবহু টেক্সট নরমালাইজেশন
    resolvedSlugs.add(normalizeText(textVal));

    // ২. রেজিস্ট্রি থেকে স্লাগ ম্যাপিং
    const mapped = getItemSlug(textVal);
    if (mapped) {
      resolvedSlugs.add(normalizeText(mapped));
    }
  });

  return Array.from(resolvedSlugs);
};

export default async function ItemView({
  slug = "",
  authorSlug = "",
  slugsArray = [],
}: ItemViewProps) {
  // কার্যকর স্লাগ নির্ধারণ
  const effectiveRawSlug = decodeURIComponent(
    slug || (slugsArray.length > 0 ? slugsArray[0] : "")
  ).trim();

  // রেজিস্ট্রি থেকে স্লাগ নির্ধারণ
  const mappedSlug = effectiveRawSlug ? getItemSlug(effectiveRawSlug) : "";
  const targetKey = mappedSlug || effectiveRawSlug;

  // ডিসপ্লে টাইটেল নির্ধারণ
  let displayTitle = "সকল আইটেম";
  if (targetKey) {
    displayTitle =
      ITEM_REGISTRY[targetKey]?.name ||
      ITEM_REGISTRY[effectiveRawSlug]?.name ||
      effectiveRawSlug;
  }

  // টাইপস্ক্রিপ্ট সেফ ডাটা ফেচিং
  const rawLibraryItems = await getAllLibraryItems();
  const allLibraryItems = (rawLibraryItems || []) as unknown as LibraryItem[];

  // নির্দিষ্ট আইটেম ও প্রকরণ অনুযায়ী ফিল্টারিং
  const filteredItems = allLibraryItems.filter((entry) => {
    // ১. লেখক ফিল্টার (যদি থাকে)
    if (authorSlug) {
      const entryAuthor = normalizeText(extractAuthorValue(entry));
      const targetAuthor = normalizeText(authorSlug);

      if (entryAuthor !== targetAuthor) {
        return false;
      }
    }

    // ২. কোনো স্লাগ না থাকলে সব আইটেম দেখাবে
    if (!effectiveRawSlug) {
      return true;
    }

    // ৩. প্রকরণ বা ক্যাটাগরি ফিল্টার
    const entrySlugs = extractItemSlugsFromEntry(entry);
    const targetNormalized = normalizeText(effectiveRawSlug);
    const mappedNormalized = normalizeText(mappedSlug);

    return (
      entrySlugs.includes(targetNormalized) ||
      (mappedNormalized && entrySlugs.includes(mappedNormalized)) ||
      // ✅ বাধ্যতামূলক frontmatter.slug এর সাথে সরাসরি মেলানো
      (entry.titleSlug && normalizeText(entry.titleSlug) === targetNormalized)
    );
  });

  return (
    <ItemViewClient
      initialItems={filteredItems}
      displayTitle={displayTitle}
      itemSlug={targetKey}
      slugsArray={slugsArray}
    />
  );
}