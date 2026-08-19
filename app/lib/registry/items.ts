// app/lib/registry/items.ts

export interface ItemMeta {
  name: string;      // বাংলা নাম (যেমন: "গল্প")
  slug: string;      // ইউআরএল স্লাগ (যেমন: "story")
  description?: string;
}

// 🟢 আইটেম রেজিস্ট্রি ডিকশনারি
export const ITEM_REGISTRY: Record<string, ItemMeta> = {
  "গল্প": { name: "গল্প", slug: "story" },
  "ছোটগল্প": { name: "ছোটগল্প", slug: "short-story" },
  "উপন্যাস": { name: "উপন্যাস", slug: "novel" },
  "কবিতা": { name: "কবিতা", slug: "poem" },
  "প্রবন্ধ": { name: "প্রবন্ধ", slug: "essay" },
  "নাটক": { name: "নাটক", slug: "drama" },
  "ছড়া": { name: "ছড়া", slug: "rhyme" },
  "ভয়": { name: "ভয়", slug: "horror" },
  "অনুবাদ": { name: "অনুবাদ", slug: "translation" },
};

/**
 * বাংলা নাম বা অবজেক্ট থেকে সুরক্ষিতভাবে স্লাগ খুঁজে বের করার হেল্পার
 */
export function getItemSlug(itemNameOrObj: any): string {
  if (!itemNameOrObj) return "";

  // যদি ফ্রন্টম্যাটারে অবজেক্ট হিসেবে নাম থাকে
  const name = typeof itemNameOrObj === "object" 
    ? (itemNameOrObj.name || itemNameOrObj.title || "") 
    : String(itemNameOrObj);

  const cleanName = name.trim();

  // ১. রেজিস্ট্রিতে পাওয়া গেলে রেজিস্ট্রিকৃত স্লাগ পাঠাবে
  if (ITEM_REGISTRY[cleanName]) {
    return ITEM_REGISTRY[cleanName].slug;
  }

  // ২. রেজিস্ট্রিতে না থাকলে স্পেসকে ড্যাশ বানিয়ে ডিফল্ট স্লাগ তৈরি করবে
  return cleanName.toLowerCase().replace(/\s+/g, "-");
}