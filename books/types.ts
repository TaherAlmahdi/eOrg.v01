// ==========================================
// Core Interfaces & Types
// ==========================================

export interface ChapterItem {
  slug: string;
  title: string;
  genre?: string | string[];
  genres?: string[];
  item?: string | string[];
  items?: string[];
  itemsSlug?: string;
  items_link?: string;
  content?: string;
  series?: string | string[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
}

export interface VolumeItem {
  id: string;
  title: string;
  chapters?: ChapterItem[];
  series?: string | string[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
}

export interface MetaFileItem {
  slug: string;
  title: string;
}

export interface SeriesItem {
  name: string;
  slug: string;
  link?: string;
  order?: number | string;
  title?: string;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  meta_title?: string;
  meta_description?: string;
  author: string;
  authorSlug: string;
  translator?: string;
  translatorSlug?: string;
  editor?: string;
  editorSlug?: string;
  subdomains: string[];
  genres: string[];
  genre?: string | string[];
  genre_links?: Array<{ name: string; link: string }>;
  items?: string[];
  item?: string | string[];
  series?: string | string[];
  seriesList?: SeriesItem[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
  series_title?: string;
  series_info?: SeriesItem | SeriesItem[];
  volumes?: VolumeItem[];
  directChapters?: ChapterItem[];
  metaFiles?: MetaFileItem[];
  publishDate?: string;
  published?: string;
  first_published?: string | number;
  publisher?: string;
  cover?: string;
  cover_image?: string;
  source_book?: string | number;
  pub_medium?: string;
  notice?: string;
  og_image?: string;
  footnotes?: string[];
  chapter_title?: string;
  volume_title?: string;
  currentChapterTitle?: string;
  currentVolumeTitle?: string;
  prevLink?: string;
  prevLabel?: string;
  nextLink?: string;
  nextLabel?: string;
}

export interface BookDetail extends Book {
  content: string;
  rawFrontmatter: Record<string, unknown>;
}

export interface BookNode {
  type: 'volume' | 'chapter';
  href: string;
  title: string;
  volId: string;
  chapterSlug?: string;
  filePath: string;
  series?: string | string[];
  seriesSlug?: string;
  series_link?: string;
  series_order?: number | string;
}