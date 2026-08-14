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
    "abu-ishaque": "আবু ইসহাক",
    "bankim-chandra-chatterjee": "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
    "bibhutibhushan-bandyopadhyay": "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
    "bibhutibhushan-mukhopadhyay": "বিভূতিভূষণ মুখোপাধ্যায়",
    "humayun-ahmed": "হুমায়ূন আহমেদ",
    "jibananda-dash": "জীবনানন্দ দাশ",
    "kazi-nazrul-islam": "কাজী নজরুল ইসলাম",
    "muhammad-lutfar-rahman": "মুহম্মদ লুৎফর রহমান",
    "muhammad-nazibur-rahman": "মুহম্মদ নাজিবুর রহমান",
    "muhammad-zafar-iqbal": "মুহম্মদ জাফর ইকবাল",
    "al-mahmud": "আল মাহমুদ",
    "rabindranath-tagore": "রবীন্দ্রনাথ ঠাকুর",
    "sarat-chandra-chattopadhyay": "শরৎচন্দ্র চট্টোপাধ্যায়",
    "satyajit-ray": "সত্যজিৎ রায়",
    "shamsur-rahman": "শামসুর রহমান",
    "sufia-kamal": "সুফিয়া কামাল",
    "syed-mujtaba-ali": "সৈয়দ মুজতবা আলী",
    "syed-shamsul-haque": "সৈয়দ শামসুল হক",
    "syed-waliullah": "সৈয়দ ওয়ালীউল্লাহ",
    "abanindranath-tagore": "অবনীন্দ্রনাথ ঠাকুর",
    "zahir-raihan": "জহির রায়হান",
    "ishwar-chandra-vidyasagar": "ঈশ্বরচন্দ্র বিদ্যাসাগর",
    "anowar-pasha": "আনোয়ার পাশা",
    "uttam-kumar-chatterjee": "উত্তমকুমার চট্টোপাধ্যায়",
    "kasem-bin-abu-bakar": "কাসেম বিন আবু বাকার",
    "charu-chandra-chakraborty": "জরাসন্ধ (চারুচন্দ্র চক্রবর্তী)",
    "jahiruddin-babar": "জহির উদ্দীন বাবর",
    "muhammad-jalaluddin-biswas": "মুহম্মদ জালালউদ্দীন বিশ্বাস",
    "abhik-chatterjee": "অভীক চট্টোপাধ্যায়",

  } as Record<string, string>,

  // English Slug -> Bengali Value
  genres: {
    "adventure-fiction": "সাহসিক কাহিনী",
    "autobiography": "আত্মজীবনী",
    "biography": "জীবনী",
    "children-fiction": "শিশু কাহিনী",
    "childrens-literature": "শিশুসাহিত্য",
    "classic": "ধ্রুপদী সাহিত্য",
    "detective-fiction": "গুপ্তচর কাহিনী",
    "drama": "নাটক",
    "drama-fiction": "নাট্য কাহিনী",
    "essay": "প্রবন্ধ",
    "essays": "প্রবন্ধাবলী",
    "fables": "নীতিকথা",
    "folklore": "লোকগাথা",
    "hinduism": "হিন্দুধর্ম",
    "historical-criticism": "ঐতিহাসিক সমালোচনা",
    "historical-essay": "ঐতিহাসিক প্রবন্ধ",
    "historical-fiction": "ঐতিহাসিক কাহিনী",
    "historical-novel": "ঐতিহাসিক উপন্যাস",
    "historical-translation": "ঐতিহাসিক অনুবাদ",
    "history": "ইতিহাস",
    "horror-fiction": "ভয়ঙ্কর কাহিনী",
    "humor": "রম্য সাহিত্য",
    "islam": "ইসলাম",
    "language-learning": "ভাষা শিক্ষা",
    "letters": "পত্রাবলী",
    "literary-criticism": "সাহিত্য সমালোচনা",
    "literary-criticism-translation": "সাহিত্য সমালোচনা অনুবাদ",
    "literary-essay": "সাহিত্য প্রবন্ধ",
    "literary-fiction": "সাহিত্যিক কাহিনী",
    "literary-translation": "সাহিত্য অনুবাদ",
    "love-story": "প্রেম কাহিনী",
    "memoir": "স্মৃতিকথা",
    "miscellaneous": "বিবিধ",
    "mythology": "পুরাণ",
    "novel": "উপন্যাস",
    "novella": "উপন্যাসিকা", 
    "philosophical-criticism": "দর্শন সমালোচনা",
    "philosophical-essay": "দর্শন প্রবন্ধ",
    "philosophical-translation": "দর্শন অনুবাদ",
    "philosophy": "দর্শন",
    "poem": "কবিতা",
    "poetry": "কাব্য",
    "prison-story": "কারা কাহিনী",
    "poetry-collection": "কবিতা সঙ্কলন",
    "psychological-novel": "মনস্তাত্ত্বিক উপন্যাস",
    "religious": "ধর্মীয় সাহিত্য",
    "religious-criticism": "ধর্মীয় সমালোচনা",
    "religious-essay": "ধর্মীয় প্রবন্ধ",
    "religious-translation": "ধর্মীয় অনুবাদ",
    "romance-fiction": "রোমান্টিক কাহিনী",
    "romantic-novel": "রোমান্টিক উপন্যাস",
    "satire": "ব্যঙ্গাত্মক কাহিনী",
    "science": "বিজ্ঞান",
    "science-criticism": "বিজ্ঞান সমালোচনা",
    "science-essay": "বিজ্ঞান প্রবন্ধ",
    "science-fiction": "বিজ্ঞান কল্পকাহিনী",
    "science-translation": "বিজ্ঞান অনুবাদ",
    "short-stories": "ছোটগল্প সংকলন",
    "social-novel": "সামাজিক উপন্যাস",
    "stories": "গল্পগ্রন্থ",
    "story": "ছোটগল্প",
    "supernatural-fiction": "অলৌকিক গল্প",
    "theology": "ধর্মতত্ত্ব",
    "translation": "অনুবাদ",
    "travel-essay": "ভ্রমণ প্রবন্ধ",
    "travelogue": "ভ্রমণকাহিনী",
    "uncollected-works": "অগ্রন্থিত রচনা",
    "unpublished-works": "অপ্রকাশিত রচনা",
    "epistolary-novel": "পত্রোপন্যাস",
    "liberation-war-novel": "মুক্তিযুদ্ধের উপন্যাস"

        
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