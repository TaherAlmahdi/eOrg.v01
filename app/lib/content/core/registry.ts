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
    "bankim-chandra-chatterjee": "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
    "rabindranath-tagore": "রবীন্দ্রনাথ ঠাকুর",
    "kazi-nazrul-islam": "কাজী নজরুল ইসলাম",
    "jibananda-dash": "জীবনানন্দ দাশ",
    "sarat-chandra-chattopadhyay": "শরৎচন্দ্র চট্টোপাধ্যায়",
  } as Record<string, string>,

  // English Slug -> Bengali Value
  genres: {
    "novel": "উপন্যাস",
    "novella": "উপন্যাসিকা", 
    "humor": "রম্য সাহিত্য",
    "religious": "ধর্মীয় সাহিত্য",
    "essays": "প্রবন্ধাবলী",
    "poetry": "কাব্য",
    "poem": "কবিতা",
    "classic": "ধ্রুপদী সাহিত্য",
    "folklore": "লোকগাথা",
    "history": "ইতিহাস",
    "story": "ছোটগল্প",
    "stories": "গল্পগ্রন্থ",
    "essay": "প্রবন্ধ",
    "drama": "নাটক",
    "letters": "পত্রাবলী",
    "others": "বিবিধ",
    "romantic-novel": "রোমান্টিক উপন্যাস",
    "historical-novel": "ঐতিহাসিক উপন্যাস",
    "social-novel": "সামাজিক উপন্যাস",
    "hinduism": "হিন্দুধর্ম",
    "philosophy": "দর্শন",
    "science": "বিজ্ঞান",
    "islam": "ইসলাম",
    "psychological-novel": "মনস্তাত্ত্বিক উপন্যাস",
    "childrens-literature": "শিশুসাহিত্য",
    "fables": "নীতিকথা",
    "translation": "অনুবাদ",
    "supernatural-fiction": "অলৌকিক গল্প",
    "language-learning": "ভাষা শিক্ষা",
    "biography": "জীবনী",
    "autobiography": "আত্মজীবনী",
    "travelogue": "ভ্রমণকাহিনী",
    "science-fiction": "বিজ্ঞান কল্পকাহিনী",
    "detective-fiction": "গুপ্তচর কাহিনী",
    "adventure-fiction": "সাহসিক কাহিনী",
    "horror-fiction": "ভয়ঙ্কর কাহিনী",
    "romance-fiction": "রোমান্টিক কাহিনী",
    "historical-fiction": "ঐতিহাসিক কাহিনী",
    "mythology": "পুরাণ",
    "children-fiction": "শিশু কাহিনী",
    "literary-fiction": "সাহিত্যিক কাহিনী",
    "satire": "ব্যঙ্গাত্মক কাহিনী",
    "drama-fiction": "নাট্য কাহিনী",
    "short-stories": "ছোটগল্প সংকলন",
    "poetry-collection": "কবিতা সংকলন",
    "literary-criticism": "সাহিত্য সমালোচনা",
    "memoir": "স্মৃতিকথা",
    "historical-essay": "ঐতিহাসিক প্রবন্ধ",
    "literary-essay": "সাহিত্য প্রবন্ধ",
    "religious-essay": "ধর্মীয় প্রবন্ধ",
    "philosophical-essay": "দর্শন প্রবন্ধ",
    "travel-essay": "ভ্রমণ প্রবন্ধ",
    "science-essay": "বিজ্ঞান প্রবন্ধ",
    "literary-translation": "সাহিত্য অনুবাদ",
    "historical-translation": "ঐতিহাসিক অনুবাদ",
    "religious-translation": "ধর্মীয় অনুবাদ",
    "philosophical-translation": "দর্শন অনুবাদ",
    "science-translation": "বিজ্ঞান অনুবাদ",
    "literary-criticism-translation": "সাহিত্য সমালোচনা অনুবাদ",
    "historical-criticism": "ঐতিহাসিক সমালোচনা",
    "religious-criticism": "ধর্মীয় সমালোচনা",
    "philosophical-criticism": "দর্শন সমালোচনা",
    "science-criticism": "বিজ্ঞান সমালোচনা",
        
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
 * রুল ২: ইউআরএল-এর ইংরেজি স্লাগ থেকে মূল বাংলা ঘরানা উদ্ধার করার ফাংশন।
 * উদাহরণ: getGenreTitle("novel") -> "উপন্যাস"
 */
export function getGenreTitle(slug: string): string {
  if (!slug) return "";
  const decoded = decodeURIComponent(slug).toLowerCase();
  
  return CONTENT_REGISTRY.genres[decoded] || decodeURIComponent(slug);
}

/**
 * রুল ৩: ইউআরএল-এর ইংরেজি স্লাগ থেকে লেখকের বাংলা নাম উদ্ধার করার ফাংশন।
 * উদাহরণ: getAuthorTitle("rabindranath-tagore") -> "রবীন্দ্রনাথ ঠাকুর"
 */
export function getAuthorTitle(slug: string): string {
  if (!slug) return "";
  const decoded = decodeURIComponent(slug).toLowerCase();

  return CONTENT_REGISTRY.authors[decoded] || decodeURIComponent(slug);
}

/**
 * রুল ৪: লেখকের বাংলা নাম থেকে ইংরেজি স্লাগ উদ্ধার করার ফাংশন।
 * উদাহরণ: getAuthorSlugFromTitle("রবীন্দ্রনাথ ঠাকুর") -> "rabindranath-tagore"
 */
export function getAuthorSlugFromTitle(authorName: string): string | undefined {
  if (!authorName) return undefined;
  const trimmed = authorName.trim();

  // CONTENT_REGISTRY.authors-এর Value (বাংলা নাম) সার্চ করে matching Key (English Slug) রিটার্ন করবে
  const entry = Object.entries(CONTENT_REGISTRY.authors).find(
    ([_, value]) => value.trim() === trimmed
  );

  return entry ? entry[0] : undefined;
}

/**
 * লেবেল অনুবাদের ফাংশন
 */
export function getLabelTranslation(key: string): string {
  const labels: Record<string, string> = {
    ...CONTENT_REGISTRY.labels,
    publisher: "প্রকাশক",
    published: "প্রকাশকাল",
  };

  return labels[key] || key;
}