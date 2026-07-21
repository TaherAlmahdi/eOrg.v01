// app/lib/content/core/registry.ts

export const CONTENT_REGISTRY = {
  labels: {
    author: "লেখক",
    genre: "ঘরানা",
    tags: "শ্রেণী",
    volume: "গ্রন্থখণ্ড",
    chapter: "অধ্যায় বা পরিচ্ছেদ",
  } as Record<string, string>,

  authors: {
    "বঙ্কিমচন্দ্র চট্টোপাধ্যায়": "bankim",
    "রবীন্দ্রনাথ ঠাকুর": "rabindra",
    "কাজী নজরুল ইসলাম": "nazrul",
    "জীবনানন্দ দাশ": "jibananda",
    "শরৎচন্দ্র চট্টোপাধ্যায়": "sharat",
  } as Record<string, string>,

  // English Slug -> Bengali Value
  genres: {
    "novel": "উপন্যাস",
    "novella": "অনু-উপন্যাস", 
    "humor": "রম্য সাহিত্য",
    "religious": "ধর্মীয় সাহিত্য",
    "essays": "প্রবন্ধাবলী",
    "poetry": "কবিতা",
    "classic": "ধ্রুপদী সাহিত্য",
    "folklore": "লোকগাথা",
    "history": "ইতিহাস",
    "story": "ছোটগল্প",
    "essay": "প্রবন্ধ",
    "drama": "নাটক",
    "letters": "পত্রাবলী",
    "others": "বিবিধ",
    "romantic-novel": "রোমান্টিক উপন্যাস",
    "historical-novel": "ঐতিহাসিক উপন্যাস",
    "social-novel": "সামাজিক উপন্যাস",
    "hinduism": "হিন্দুধর্ম",
    "philosophy": "দর্শন"
  } as Record<string, string>,

  tags: {
    "ধ্রুপদী": "classical",
    "ঐতিহাসিক": "historical",
    "রোমান্টিক": "romantic",
  } as Record<string, string>,
};

/**
 * রুল ১: MD ফাইলের যেকোনো বাংলা টেক্সট থেকে ইংরেজি স্লাগ তৈরি করার সর্বজনীন ফাংশন।
 * উদাহরণ: getSlug("genres", "উপন্যাস") -> "novel"
 */
export function getSlug(type: "authors" | "genres" | "tags", banglaText: string): string {
  if (!banglaText) return "others";
  const cleaned = banglaText.trim();

  // Genres-এর জন্য Value (বাংলা) ধরে Key (ইংরেজি স্লাগ) খোঁজা হবে
  if (type === "genres") {
    const entry = Object.entries(CONTENT_REGISTRY.genres).find(
      ([_, value]) => value === cleaned
    );
    return entry ? entry[0] : encodeURIComponent(cleaned);
  }

  // Authors এবং Tags-এর জন্য Key (বাংলা) ধরে Value (ইংরেজি) খোঁজা হবে
  if (CONTENT_REGISTRY[type] && CONTENT_REGISTRY[type][cleaned]) {
    return CONTENT_REGISTRY[type][cleaned];
  }

  return encodeURIComponent(cleaned);
}

/**
 * রুল ২: ইউআরএল-এর ইংরেজি স্লাগ থেকে মূল বাংলা টেক্সট উদ্ধার করার ফাংশন (পেজ ফিল্টারিং ও টাইটেলের জন্য)।
 * উদাহরণ: getGenreTitle("novel") -> "উপন্যাস"
 */
export function getGenreTitle(slug: string): string {
  if (!slug) return "";
  const decoded = decodeURIComponent(slug).toLowerCase();
  
  return CONTENT_REGISTRY.genres[decoded] || decodeURIComponent(slug);
}

// app/lib/content/core/registry.ts-এ এই ফাংশনটি এক্সপোর্ট করুন

export function getLabelTranslation(key: string): string {
  const labels: Record<string, string> = {
    author: "লেখক",
    genre: "ঘরানা",
    tags: "ট্যাগসমূহ",
    publisher: "প্রকাশক",
    published: "প্রকাশকাল",
  };

  return labels[key] || key;
}