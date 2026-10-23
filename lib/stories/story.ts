import {
  findSlugByLegacy,
  getStoryRow,
  listStoryRows,
  type StoryRow,
} from './local';

// ==========================================
// 📐 Types
// ==========================================

export interface StoryFrontmatter {
  id?: string | number; // ১০ অঙ্কের আইডি (যেমন: 2026100103)
  title: string;
  subtitle?: string;
  bookName?: string;
  book?: string;
  author?: string | string[];
  translator?: string | string[];
  editor?: string | string[];
  meta_title?: string;
  meta_description?: string;
  ogImage: string;
  cover_image?: string;
  notice?: string;
  courtesy?: string;
  prevLink?: string;
  prevLabel?: string;
  nextLink?: string;
  nextLabel?: string;
  order?: number;
  [key: string]: unknown;
}

// একটি গল্পের পূর্ণ বিবরণ — একক গল্পের পাতার (/story/[slug]) জন্য
export interface StoryDetail {
  id?: string | number;
  uuid: string; // Supabase story id (view counts follow this, not the slug)
  slug: string;
  title: string;
  subtitle?: string;
  bookName?: string;
  author?: string | string[];
  translator?: string | string[];
  editor?: string | string[];
  meta_title?: string;
  meta_description?: string;
  ogImage: string;
  cover_image?: string;
  content: string; // HTML body
  rawFrontmatter: StoryFrontmatter;
  prevLink?: string;
  prevLabel?: string;
  nextLink?: string;
  nextLabel?: string;
  views?: number;
  /** name -> people.slug, for the author link in the breadcrumb */
  peopleSlugs?: Record<string, string>;
}

// তালিকা/কার্ড ভিউয়ের জন্য গল্পের সংক্ষিপ্ত রূপ
export interface Story {
  id?: string | number;
  uuid: string;
  slug: string;
  title: string;
  subtitle?: string;
  bookName?: string;
  author?: string | string[];
  translator?: string | string[];
  editor?: string | string[];
  meta_description?: string;
  cover_image?: string;
  ogImage: string;
  order: number;
  views?: number;
  /** name -> people.slug, for author/translator/editor links */
  peopleSlugs?: Record<string, string>;
}

// ==========================================
// 🗂️ Supabase row -> site shape
// ==========================================

/** One name stays a string, several stay a list (as with the old front matter). */
const collapse = (names: string[]): string | string[] | undefined =>
  names.length === 0 ? undefined : names.length === 1 ? names[0] : names;

function toStory(row: StoryRow): Story {
  return {
    id: row.storyId ?? undefined,
    uuid: row.uuid,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    bookName: row.book ?? undefined,
    author: collapse(row.author),
    translator: collapse(row.translator),
    editor: collapse(row.editor),
    meta_description: row.description ?? undefined,
    ogImage: row.ogImage ?? '',
    order: Number.MAX_SAFE_INTEGER,
    views: row.views,
    peopleSlugs: row.peopleSlugs,
  };
}

// ==========================================
// 📖 মূল ফাংশন: স্লাগ দিয়ে একটি গল্প খোঁজা
// ==========================================

export async function getStoryBySlug(slug: string): Promise<StoryDetail | null> {
  if (!slug) return null;

  const row = await getStoryRow(slug);
  if (!row) return null;

  const base = toStory(row);

  // ➡️ পূর্ববর্তী/পরবর্তী গল্প বের করা (লিস্টের ক্রম অনুযায়ী)
  const list = await listStoryRows();
  const currentIdx = list.findIndex((item) => item.slug === row.slug);

  let prevLink: string | undefined;
  let prevLabel: string | undefined;
  let nextLink: string | undefined;
  let nextLabel: string | undefined;

  if (currentIdx !== -1) {
    if (currentIdx > 0) {
      prevLink = `/story/${list[currentIdx - 1].slug}`;
      prevLabel = list[currentIdx - 1].title;
    }
    if (currentIdx < list.length - 1) {
      nextLink = `/story/${list[currentIdx + 1].slug}`;
      nextLabel = list[currentIdx + 1].title;
    }
  }

  return {
    id: base.id,
    uuid: row.uuid,
    slug: row.slug,
    title: row.title,
    subtitle: base.subtitle,
    bookName: base.bookName,
    author: base.author,
    translator: base.translator,
    editor: base.editor,
    meta_description: base.meta_description,
    ogImage: base.ogImage,
    content: row.content,
    rawFrontmatter: {
      id: row.storyId ?? undefined,
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      book: row.book ?? undefined,
      author: base.author,
      translator: base.translator,
      editor: base.editor,
      meta_description: row.description ?? undefined,
      ogImage: row.ogImage ?? '',
      notice: row.notice ?? undefined,
      courtesy: row.courtesy ?? undefined,
    },
    prevLink,
    prevLabel,
    nextLink,
    nextLabel,
    views: row.views,
    peopleSlugs: row.peopleSlugs,
  };
}

/** The current slug of a story whose old (file-name) slug is `legacySlug`, or null. */
export async function getCurrentSlugForLegacy(legacySlug: string): Promise<string | null> {
  if (!legacySlug) return null;
  return findSlugByLegacy(legacySlug);
}

// ==========================================
// 📋 সব গল্পের তালিকা
// ==========================================

export async function getAllStories(): Promise<Story[]> {
  return (await listStoryRows()).map(toStory);
}
