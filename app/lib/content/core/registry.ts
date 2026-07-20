// app/lib/content/core/registry.ts

export const CONTENT_REGISTRY = {
  // ১. মেটাডাটার ইংরেজি কী (Key) গুলোর বাংলা পরিভাষা (যা সাইটের পেজে প্রদর্শিত হবে)
  labels: {
    author: "লেখক",
    genre: "ঘরানা", // আপনার পছন্দ অনুযায়ী "ধরণ" বা "সাহিত্যশ্রেণী"ও দিতে পারেন
    tags: "শ্রেণী",   // আপনার পছন্দ অনুযায়ী "ট্যাগ" এর বদলে "সূচক শব্দ" বা "বিষয়" দিতে পারেন
    volume: "গ্রন্থখণ্ড",
    chapter: "অধ্যায় বা পরিচ্ছেদ",
  } as Record<string, string>,

  // ২. লেখকদের বাংলা নাম থেকে ইংরেজি স্ল্যাগ ম্যাপিং
  authors: {
    "বঙ্কিমচন্দ্র চট্টোপাধ্যায়": "bankim",
    "রবীন্দ্রনাথ ঠাকুর": "rabindra",
    "কাজী নজরুল ইসলাম": "nazrul",
    "জীবনানন্দ দাশ": "jibananda",
    "শরৎচন্দ্র চট্টোপাধ্যায়": "sharat",
  } as Record<string, string>,

  // ৩. সাহিত্যের জনরা (Genre) বাংলা নাম থেকে ইংরেজি স্ল্যাগ ম্যাপিং
  genres: {
    "উপন্যাস": "novel",
    "কবিতা": "poetry",
    "প্রবন্ধ": "essay",
    "ছোটগল্প": "short-story",
    "নাটক": "drama",
  } as Record<string, string>,

  // ৪. ট্যাগের বাংলা নাম থেকে ইংরেজি স্ল্যাগ ম্যাপিং
  tags: {
    "ধ্রুপদী": "classical",
    "ঐতিহাসিক": "historical",
    "রোমান্টিক": "romantic",
  } as Record<string, string>,
};

/**
 * ইউআরএল-এর জন্য: বাংলা নাম ইনপুট দিলে রেজিস্ট্রি থেকে তার ইংরেজি স্ল্যাগ খুঁজে বের করার ফাংশন
 */
export function getSlugFromRegistry(type: "authors" | "genres" | "tags", banglaName: string): string {
  if (!banglaName) return "unknown";
  const cleanedName = banglaName.trim();
  return CONTENT_REGISTRY[type][cleanedName] || "unknown";
}

/**
 * পেজে প্রদর্শনের জন্য: ইংরেজি মেটাডাটা কী (যেমন 'genre' বা 'author') দিলে তার খাঁটি বাংলা পরিভাষা রিটার্ন করার ফাংশন
 * উদাহরণ: getLabelTranslation("genre") -> "সাহিত্যরূপ"
 */
export function getLabelTranslation(englishKey: "author" | "genre" | "tags" | "volume" | "chapter"): string {
  return CONTENT_REGISTRY.labels[englishKey] || englishKey;
}