// app/lib/content/core/registry/items.ts

import { generateRawSlug } from "./slug";

export interface ItemMeta {
  name: string;         // বাংলা নাম (যেমন: "গল্প")
  slug: string;         // ইউআরএল স্লাগ (যেমন: "story")
  description?: string;
}

// 🟢 মূল আইটেম রেজিস্ট্রি ডিকশনারি (বাংলা বর্ণানুক্রমিক সাজানো)
export const ITEM_REGISTRY: Record<string, ItemMeta> = {
  "autobiography": {
    name: "আত্মজীবনী",
    slug: "autobiography",
  },
  "address": {
    name: "অভিভাষণ",
    slug: "address",
  },
  "translation": {
    name: "অনুবাদ",
    slug: "translation",
  },
  "translators-note": {
    name: "অনুবাদকের কথা",
    slug: "translators-note",
  },
  "will": {
    name: "ইচ্ছাপত্র",
    slug: "will",
  },
  "declaration-of-wishes": {
    name: "ইচ্ছার ঘোষণা",
    slug: "declaration-of-wishes",
  },
  "novel": {
    name: "উপন্যাস",
    slug: "novel",
  },
  "novella": {
    name: "উপন্যাসিকা",
    slug: "novella",
  },
  "fable": {
    name: "উপকথা",
    slug: "fable",
  },
  "prologue": {
    name: "উপক্রমণিকা",
    slug: "prologue",
  },
  "epilogue": {
    name: "উপসংহার",
    slug: "epilogue",
  },
  "dedication": {
    name: "উৎসর্গপত্র",
    slug: "dedication",
  },
  "one-act-play": {
    name: "একাঙ্ক নাটক",
    slug: "one-act-play",
  },
  "conversation": {
    name: "কথোপকথন",
    slug: "conversation",
  },
  "poem": {
    name: "কবিতা",
    slug: "poem",
  },
  "column": {
    name: "কলাম",
    slug: "column",
  },
  "legend": {
    name: "কিংবদন্তি",
    slug: "legend",
  },
  "song": {
    name: "গান",
    slug: "song",
  },
  "lyrics": {
    name: "গীতি",
    slug: "lyrics",
  },  
  
  "story": {
    name: "গল্প",
    slug: "story",
  },
  "short-story": {
    name: "ছোটগল্প",
    slug: "short-story",
  },
  "rhyme": {
    name: "ছড়া",
    slug: "rhyme",
  },
  "letter": {
    name: "চিঠি",
    slug: "letter",
  },
  "biography": {
    name: "জীবনী",
    slug: "biography",
  },
  "note": {
    name: "টীকা",
    slug: "note",
  },
  "commentary": {
    name: "মন্তব্য",
    slug: "commentary",
  },
  "diary": {
    name: "দিনলিপি",
    slug: "diary",
  },
  "document": {
    name: "দলিল",
    slug: "document",
  },
  "drama": {
    name: "নাটক",
    slug: "drama",
  },
  "article": {
    name: "নিবন্ধ",
    slug: "article",
  },
  "nivedan": {
    name: "নিবেদন",
    slug: "nivedan",
  },
  "patra": {
    name: "পত্র",
    slug: "patra",
  },
  "correspondence": {
    name: "পত্রাবলী",
    slug: "correspondence",
  },
  "retelling": {
    name: "পুনর্কথন",
    slug: "retelling",
  },
  "essay": {
    name: "প্রবন্ধ",
    slug: "essay",
  },
  "farce": {
    name: "প্রহসন",
    slug: "farce",
  },
  "preface": {
    name: "প্রস্তাবনা",
    slug: "preface",
  },
  "report": {
    name: "প্রতিবেদন",
    slug: "report",
  },
  "review": {
    name: "পর্যালোচনা",
    slug: "review",
  },
  "speech": {
    name: "বক্তৃতা",
    slug: "speech",
  },
  "statement": {
    name: "বিবৃতি",
    slug: "statement",
  },
  "satire": {
    name: "ব্যঙ্গ",
    slug: "satire",
  },
  "introduction": {
    name: "ভূমিকা",
    slug: "introduction",
  },
  "introductory-note": {
    name: "ভূমিকা-লেখা",
    slug: "introductory-note",
  },
  "bhassya": {
    name: "ভাষ্য",
    slug: "bhassya",
  },
  "travelogue": {
    name: "ভ্রমণকাহিনী",
    slug: "travelogue",
  },
  "travel-account": {
    name: "ভ্রমণবৃত্তান্ত",
    slug: "travel-account",
  },
  "memoir": {
    name: "স্মৃতিকথা",
    slug: "memoir",
  },
  "reminiscence": {
    name: "স্মৃতিচিত্র",
    slug: "reminiscence",
  },
  "memorandum": {
    name: "স্মারকলিপি",
    slug: "memorandum",
  },
  "humor": {
    name: "রম্য",
    slug: "humor",
  },
  "humorous-essay": {
    name: "রম্যপ্রবন্ধ",
    slug: "humorous-essay",
  },
  "humorous-writing": {
    name: "রম্যরচনা",
    slug: "humorous-writing",
  },
  "humorous-travelogue": {
    name: "রম্যভ্রমণ",
    slug: "humorous-travelogue",
  },
  "adaptation": {
    name: "রূপান্তর",
    slug: "adaptation",
  },
  "fairy-tale": {
    name: "রূপকথা",
    slug: "fairy-tale",
  },
  "authors-note": {
    name: "লেখকের কথা",
    slug: "authors-note",
  },
  "folktale": {
    name: "লোককাহিনি",
    slug: "folktale",
  },
  "dialogue": {
    name: "সংলাপ",
    slug: "dialogue",
  },
  "news": {
    name: "সংবাদ",
    slug: "news",
  },
  "editorial": {
    name: "সম্পাদকীয়",
    slug: "editorial",
  },
  "editors-note": {
    name: "সম্পাদকীয় নোট",
    slug: "editors-note",
  },
  "interview": {
    name: "সাক্ষাৎকার",
    slug: "interview",
  },
  "criticism": {
    name: "সমালোচনা",
    slug: "criticism",
  },
  "literary-criticism": {
    name: "সাহিত্য সমালোচনা",
    slug: "literary-criticism",
  },
  "scientific-essay": {
    name: "বৈজ্ঞানিক প্রবন্ধ",
    slug: "scientific-essay",
  }
};

// ⚡ ও অপটিমাইজড লুকআপ ম্যাপ (O(1) Lookup Performance)
const SLUG_LOOKUP_MAP = new Map<string, string>();

// রেজিস্ট্রি লোড হওয়ার সাথে সাথে ম্যাপ ফিল করে রাখা
Object.values(ITEM_REGISTRY).forEach((item) => {
  // ১. স্লাগ দিয়ে ম্যাচিং (যেমন: "story" -> "story")
  SLUG_LOOKUP_MAP.set(item.slug.toLowerCase(), item.slug);
  
  // ২. বাংলা নাম দিয়ে ম্যাচিং (যেমন: "গল্প" -> "story")
  SLUG_LOOKUP_MAP.set(item.name.trim(), item.slug);
  
  // ৩. বাংলা নামের রা স্লাগ বানিয়েও ম্যাপ করা
  const rawBanglaSlug = generateRawSlug(item.name);
  if (rawBanglaSlug) {
    SLUG_LOOKUP_MAP.set(rawBanglaSlug, item.slug);
  }
});

// অতিরিক্ত সিনোনিম / স্লাগ ম্যাপিং
SLUG_LOOKUP_MAP.set("poetry", "poem");
SLUG_LOOKUP_MAP.set("letter", "letter");
SLUG_LOOKUP_MAP.set("patra", "letter");
SLUG_LOOKUP_MAP.set("bhashya", "commentary");
SLUG_LOOKUP_MAP.set("nivedan", "dedication");
SLUG_LOOKUP_MAP.set("article", "articles");

/**
 * বাংলা নাম, স্লাগ বা অবজেক্ট থেকে নিরাপদভাবে স্লাগ খুঁজে বের করার হেল্পার
 */
export function getItemSlug(itemNameOrObj: any): string {
  if (!itemNameOrObj) return "";

  const rawInput = typeof itemNameOrObj === "object"
    ? (itemNameOrObj.slug || itemNameOrObj.name || itemNameOrObj.title || "")
    : String(itemNameOrObj);

  const cleanInput = rawInput.trim();
  if (!cleanInput) return "";

  const matchedSlug = SLUG_LOOKUP_MAP.get(cleanInput) || SLUG_LOOKUP_MAP.get(cleanInput.toLowerCase());
  if (matchedSlug) {
    return matchedSlug;
  }

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

  const fallbackName = typeof itemNameOrObj === "string" ? itemNameOrObj.trim() : slug;
  return {
    name: fallbackName,
    slug: slug,
  };
}