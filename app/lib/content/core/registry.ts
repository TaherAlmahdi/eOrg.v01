// app/lib/content/core/registry.ts

export * from "@/app/lib/content/core/registry/items";
export * from "@/app/lib/content/core/registry/slug";

export const CONTENT_REGISTRY = {
  labels: {
    author: "লেখক",
    genre: "ঘরানা",
    tags: "শ্রেণী",
    volume: "গ্রন্থখণ্ড",
    chapter: "অধ্যায় বা পরিচ্ছেদ",
    series: "সিরিজ",
    books: "বই",
  } as Record<string, string>,

  // English Slug -> Bengali Value
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
    "neelima-ibrahim": "নীলিমা ইব্রাহীম",
    "bhuban-chandra-mukhopadhyay": "ভুবনচন্দ্র মুখোপাধ্যায়",
    "mahbub-siddiki": "মাহবুব সিদ্দিকী",
    "johan-august-strindberg": "অগুস্ত স্ত্রিন্দবারি",
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
    "mystery-novel": "রহস্য উপন্যাস",
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
    "liberation-war-novel": "মুক্তিযুদ্ধের উপন্যাস",
    "parapsychology": "পরামনোবিজ্ঞান",
    "screenplay": "চিত্রনাট্য",
    
  } as Record<string, string>,

  // English Slug -> Bengali Value
  series: {
    "feluda": "ফেলুদা সিরিজ",
    "byomkesh": "ব্যোমকেশ সমগ্র",
    "kakababu": "কাকাবাবু সিরিজ",
    "humayun-ahmed-rachanabali": "হুমায়ূন আহমেদ রচনাবলী",
    "himu-samagra": "হিমু সমগ্র",
    "misir-ali-omnibus": "মিসির আলি অমনিবাস",
    "zahir-raihan-rachanabali": "জহির রায়হান রচনাবলী",
    "sukanta-samagra": "সুকান্ত সমগ্র",
  } as Record<string, string>,

  // English Slug -> Bengali Value
  tags: {
    "classical": "ধ্রুপদী",
    "historical": "ঐতিহাসিক",
    "romantic": "রোমান্টিক",
  } as Record<string, string>,

  // English Slug -> Bengali Value (প্রয়োজনে কাস্টম বইয়ের স্লাগ ও বাংলা নাম এখানে যোগ করা যাবে)
  books: {} as Record<string, string>,
};

export type RegistryCategory = "authors" | "genres" | "tags" | "series" | "books";

/**
 * বাংলা স্ট্রিংকে সংগত ও নরম্যালাইজড ডিকম্পোজিশনে রূপান্তর করার হেল্পার।
 * এটি 'ড+নুক্তা' ফরম্যাটকে সরাসরি একক বর্ণে (যেমন: ড়, ঢ়, য়) রূপান্তর করে।
 */
export function normalizeBanglaText(text: string): string {
  if (!text) return "";
  return String(text)
    .normalize("NFC") // ইউনিকোড কম্পোজিশন ঠিক করা (ড + ় => ড়)
    .replace(/\u09A1\u09BC/g, "ড়") // ড + নুক্তা = ড়
    .replace(/\u09A2\u09BC/g, "ঢ়") // ঢ + নুক্তা = ঢ়
    .replace(/\u09AF\u09BC/g, "য়") // য + নুক্তা = য়
    .replace(/\u09B0/g, "র");      // অসমীয়া/বাংলা র-এর সঠিক ম্যাপিং
}

/**
 * যেকোনো স্ট্রিংকে স্লাগে রূপান্তর করার হেল্পার (বাংলা ড়, ঢ়, য়, ্য, ্র সহ অন্যান্য চিহ্নের জন্য নিরাপদ)
 */
export function slugify(text: string): string {
  if (!text) return "";

  const normalized = normalizeBanglaText(text);

  return normalized
    .trim()
    .replace(/\s+/g, "-") // স্পেসের জায়গায় হাইফেন
    // \u0980-\u09FF পুরো বাংলা ব্লককে কাভার করে (যার মধ্যে ড় \u09DC, ঢ় \u09DD, য় \u09DF সহ সকল নুক্তা ও যুক্তবর্ণ রয়েছে)
    .replace(/[^\w\u0980-\u09FF\-]/g, "")
    .replace(/-+/g, "-") // একাধিক হাইফেন পাশাপাশি থাকলে একটিতে রূপান্তর
    .toLowerCase();
}

/**
 * রুল ১: যেকোনো বাংলা টেক্সট থেকে ইংরেজি স্লাগ তৈরি করার সর্বজনীন ও নিরাপদ ফাংশন।
 * কেবল শতভাগ নিশ্চিত মিল (Exact Match) থাকলেই রেজিস্ট্রি স্লাগ ফেরত দেবে, নতুবা নিরাপদভাবে slugify করবে।
 */
export function getSlug(
  type: RegistryCategory,
  banglaText: string
): string {
  if (!banglaText) return "others";
  const cleaned = normalizeBanglaText(banglaText).trim();

  const registry = CONTENT_REGISTRY[type];
  if (!registry) return slugify(cleaned);

  // ১. কেবল হুবহু মিল (Exact Match) খোঁজা হচ্ছে (নরম্যালাইজড টেক্সটের সাথে)
  const exactEntry = Object.entries(registry).find(
    ([_, value]) => normalizeBanglaText(value).trim().toLowerCase() === cleaned.toLowerCase()
  );
  if (exactEntry) return exactEntry[0];

  // ২. কোনো মিল না পেলে সরাসরি slugify ফরম্যাট রিটার্ন করবে
  return slugify(cleaned) || cleaned;
}

/**
 * রুল ২: ইউআরএল-এর ইংরেজি বা বাংলা স্লাগ থেকে মূল বাংলা ঘরানা উদ্ধার করার ফাংশন।
 */
export function getGenreTitle(slug: string): string {
  if (!slug) return "";
  const decoded = normalizeBanglaText(decodeURIComponent(slug)).toLowerCase().trim();
  return CONTENT_REGISTRY.genres[decoded] || decodeURIComponent(slug);
}

/**
 * রুল ৩: ইউআরএল-এর ইংরেজি বা বাংলা স্লাগ থেকে সিরিজের বাংলা শিরোনাম উদ্ধার করার ফাংশন।
 */
export function getSeriesTitle(slug: string): string {
  if (!slug) return "";
  const decoded = normalizeBanglaText(decodeURIComponent(slug)).toLowerCase().trim();
  return CONTENT_REGISTRY.series[decoded] || decodeURIComponent(slug);
}

/**
 * রুল ৪: ইউআরএল-এর ইংরেজি বা বাংলা স্লাগ থেকে লেখকের বাংলা নাম উদ্ধার করার ফাংশন।
 */
export function getAuthorTitle(slug: string): string {
  if (!slug) return "";
  const decoded = normalizeBanglaText(decodeURIComponent(slug)).toLowerCase().trim();
  return CONTENT_REGISTRY.authors[decoded] || decodeURIComponent(slug);
}

/**
 * রুল ৫: ইউআরএল-এর ইংরেজি বা বাংলা স্লাগ থেকে বইয়ের বাংলা নাম উদ্ধার করার ফাংশন।
 */
export function getBookTitle(slug: string): string {
  if (!slug) return "";
  const decoded = normalizeBanglaText(decodeURIComponent(slug)).toLowerCase().trim();
  return CONTENT_REGISTRY.books[decoded] || decodeURIComponent(slug);
}

/**
 * রুল ৬: লেখকের বাংলা নাম থেকে ইংরেজি স্লাগ উদ্ধার করার ফাংশন।
 */
export function getAuthorSlugFromTitle(authorName: string): string | undefined {
  if (!authorName) return undefined;
  return getSlug("authors", authorName);
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