// ==========================================
// 1. Common / Shared Base Types
// ==========================================

export type FlexibleString = string | number;
export type MultiValue<T> = T | T[];

export interface SeriesItem {
  name: string;
  slug: string;
  link?: string;
  order?: FlexibleString;
  title?: string;
}

export interface LinkItem {
  name: string;
  link: string;
}

export interface MetaFileItem {
  slug: string;
  title: string;
}

export interface SubPageItem {
  title: string;
  slug?: string;         // 👈 '?' যোগ করে optional করা হলো
  link?: string;
  pageNumber?: number;   // 👈 যুক্ত করা হলো
  subtitle?: string;     // 👈 extractors.ts-এর জন্য যুক্ত করা হলো
}

/**
 * একাধিক ইন্টারফেসে ব্যবহৃত কমন সিরিজ প্রপার্টি
 */
export interface SeriesBaseProperties {
  series?: MultiValue<string>;
  seriesSlug?: string;
  series_link?: string;
  series_order?: FlexibleString;
}

/**
 * জেনার এবং আইটেম সংক্রান্ত প্রপার্টি
 */
export interface TaxonomyProperties {
  genre?: MultiValue<string>;
  genres: string[];
  item?: MultiValue<string>;
  items: string[];
}

// ==========================================
// 2. Structural Content Types
// ==========================================

export interface ChapterItem extends SeriesBaseProperties, Partial<TaxonomyProperties> {
  slug: string;
  title: string;
  content?: string;
  itemsSlug?: string;
  items_link?: string;
}

export interface VolumeItem extends SeriesBaseProperties {
  id: string;
  title: string;
  chapters?: ChapterItem[];
}

export interface BookNode extends SeriesBaseProperties {
  type: 'volume' | 'chapter';
  href: string;
  title: string;
  volId: string;
  filePath: string;
  chapterSlug?: string;
}

// ==========================================
// 3. Main Book Interfaces
// ==========================================

export interface Book extends SeriesBaseProperties, TaxonomyProperties {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;

  // SEO & Metadata
  meta_title?: string;
  meta_description?: string;
  og_image?: string;

  // People & Entities
  author: string;
  authorSlug: string;
  translator?: string;
  translatorSlug?: string;
  editor?: string;
  editorSlug?: string;
  publisher?: string;

  // Categorization & Links
  subdomains: string[];
  genre_links?: LinkItem[];

  // Series Specific Extended Properties
  seriesList?: SeriesItem[];
  series_title?: string;
  series_info?: MultiValue<SeriesItem>;

  // Structure & Content
  volumes?: VolumeItem[];
  directChapters?: ChapterItem[];
  metaFiles?: MetaFileItem[];
  subPages?: SubPageItem[];

  // Publication Details
  publishDate?: string;
  published?: FlexibleString;
  first_published?: FlexibleString;
  source_book?: FlexibleString;
  pub_medium?: string;

  // Media & Assets
  cover?: string;
  cover_image?: string;

  // Navigation & Extra Info
  notice?: string;
  footnotes?: string[];
  chapter_title?: string;
  volume_title?: string;
  currentChapterTitle?: string;
  currentVolumeTitle?: string;
  prevLink?: string;
  prevLabel?: string;
  nextLink?: string;
  nextLabel?: string;
  [key: string]: any;
}

export interface BookDetail extends Book {
  content: string;
  rawFrontmatter: Record<string, unknown>;
}