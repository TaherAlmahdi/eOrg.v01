// app/lib/content/core/registry/items.ts

import { generateRawSlug } from "./slug";

export interface ItemMeta {
  name: string;        // বাংলা নাম (যেমন: "গল্প")
  slug: string;        // ইউআরএল স্লাগ (যেমন: "story")
  description?: string;
}

// 🟢 মূল আইটেম রেজিস্ট্রি ডিকশনারি
export const ITEM_REGISTRY: Record<string, ItemMeta> = {
  "story": {
    name: "গল্প",
    slug: "story",
  },
  "short-story": {
    name: "ছোটগল্প",
    slug: "short-story",
  },
  "poem": {
    name: "কবিতা",
    slug: "poem",
  },
  "essay": {
    name: "প্রবন্ধ",
    slug: "essay",
  },
  "rhyme": {
    name: "ছড়া",
    slug: "rhyme",
  },
};

// ⚡ ও অপটিমাইজড লুকআপ ম্যাপ (O(1) Lookup Performance)
const SLUG_LOOKUP_MAP = new Map<string, string>();

// রেজিস্ট্রি লোড হওয়ার সাথে সাথে ম্যাপ ফিল করে রাখা
Object.values(ITEM_REGISTRY).forEach((item) => {
  // ১. স্লাগ দিয়ে ম্যাচিং (যেমন: "story" -> "story")
  SLUG_LOOKUP_MAP.set(item.slug.toLowerCase(), item.slug);
  
  // ২. বাংলা নাম দিয়ে ম্যাচিং (যেমন: "গল্প" -> "story")
  SLUG_LOOKUP_MAP.set(item.name.trim(), item.slug);
  
  // ৩. বাংলা নামের রা স্লাগ বানিয়েও ম্যাপ করা (যেমন: "ছোটগল্প" বা "ছোট-গল্প" দুটিই যাতে সাপোর্ট করে)
  const rawBanglaSlug = generateRawSlug(item.name);
  if (rawBanglaSlug) {
    SLUG_LOOKUP_MAP.set(rawBanglaSlug, item.slug);
  }
});

/**
 * বাংলা নাম, স্লাগ বা অবজেক্ট থেকে নিরাপদভাবে স্লাগ খুঁজে বের করার হেল্পার
 */
export function getItemSlug(itemNameOrObj: any): string {
  if (!itemNameOrObj) return "";

  // অবজেক্ট বা স্ট্রিং থেকে ইনপুট ফিল্টার করা
  const rawInput = typeof itemNameOrObj === "object"
    ? (itemNameOrObj.slug || itemNameOrObj.name || itemNameOrObj.title || "")
    : String(itemNameOrObj);

  const cleanInput = rawInput.trim();
  if (!cleanInput) return "";

  // ১. লুকআপ ম্যাপে বাংলা নাম বা ইংরেজি স্লাগ সরাসরি খোঁজা (যেমন: "গল্প" বা "story")
  const matchedSlug = SLUG_LOOKUP_MAP.get(cleanInput) || SLUG_LOOKUP_MAP.get(cleanInput.toLowerCase());
  if (matchedSlug) {
    return matchedSlug;
  }

  // ২. রেজিস্ট্রিতে না পাওয়া গেলে নিরাপদ ডিফল্ট স্লাগ তৈরি করা
  return generateRawSlug(cleanInput);
}

/**
 * যেকোনো ইনপুট থেকে পূর্ণাঙ্গ ItemMeta অবজেক্ট বের করার হেল্পার
 */
export function getItemMeta(itemNameOrObj: any): ItemMeta {
  const slug = getItemSlug(itemNameOrObj);
  
  if (ITEM_REGISTRY[slug]) {
    return ITEM_REGISTRY[slug];
  }

  // রেজিস্ট্রিতে না থাকলে ইনপুট থেকেই ডায়নামিক মেটা তৈরি
  const fallbackName = typeof itemNameOrObj === "string" ? itemNameOrObj.trim() : slug;
  return {
    name: fallbackName,
    slug: slug,
  };
}