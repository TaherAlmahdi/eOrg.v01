// app/lib/bio.ts
// Biographies live in R2 as pages/bio/<slug>.md. The slug is the author's slug (see slug-data.ts).
// sync-assets also writes _manifest/bio-index.json (name, image, summary of every biography), which the library
// author page reads instead of the biography files, and which the page cache watches for changes.
import matter from 'gray-matter';
import type { Metadata } from 'next';
import { COVER_BASE } from '@/app/lib/cover-base';
import { getAssetsBucket, readTextFromR2 } from '@/app/lib/books/r2';
import { buildTabTitle, type SubdomainData } from '@/app/lib/get-site-data';

export const BIO_INDEX_KEY = '_manifest/bio-index.json';

export interface BioFrontmatter {
  title?: string;
  name?: string;
  real_name?: string;
  image?: string;
  summary?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  pseudonym?: string;
  occupation?: string;
  nationality?: string;
  citizenship?: string;
  genre?: string;
  notable_works?: string;
  awards?: string;
  spouse?: string;
  children?: string;
  relatives?: string;
  signature?: string;
  website?: string;
  website_name?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  [key: string]: unknown;
}

export interface BioIndexEntry {
  name?: string;
  image?: string;
  summary?: string;
}

export type BioIndex = Record<string, BioIndexEntry>;

/** Reads and parses pages/bio/<slug>.md from R2 (null if missing). */
export async function getBioData(slug: string) {
  const key = `pages/bio/${slug.toLowerCase()}.md`;
  try {
    const fileContents = await readTextFromR2(key);
    if (!fileContents) return null;
    const { data, content } = matter(fileContents);
    return { frontmatter: data as BioFrontmatter, content };
  } catch {
    return null;
  }
}

let cachedIndex: { value: BioIndex; at: number } | null = null;
const BIO_INDEX_TTL_MS = 30 * 1000;

/** The prebuilt bio index (empty until the first sync that writes it). */
export async function getBioIndex(): Promise<BioIndex> {
  if (cachedIndex && Date.now() - cachedIndex.at < BIO_INDEX_TTL_MS) return cachedIndex.value;
  let value: BioIndex = {};
  try {
    const bucket = await getAssetsBucket();
    const obj = await bucket.get(BIO_INDEX_KEY);
    const raw = obj ? await obj.text() : '';
    if (raw) value = JSON.parse(raw) as BioIndex;
  } catch (err) {
    console.error('bio index পড়তে ব্যর্থ:', err);
  }
  cachedIndex = { value, at: Date.now() };
  return value;
}

/** Author image paths like "/authors/bankim.webp" come from the media host live; locally they stay site-relative. */
export function authorImageUrl(image: string): string {
  if (!image.startsWith('/authors/')) return image;
  return process.env.NEXT_PUBLIC_COVER_BASE ? image : `${COVER_BASE}${image}`;
}

/** Metadata of a biography page (shared by /biography and /bio/<slug>). */
export function bioMetadata(frontmatter: BioFrontmatter, siteData: SubdomainData): Metadata {
  const currentPageTitle = frontmatter.title || frontmatter.name || 'জীবনী';

  const dynamicMetaTitle = buildTabTitle({
    metaTitle: frontmatter.meta_title,
    currentPageTitle,
    siteName: siteData?.title,
  });

  const description =
    frontmatter.meta_description || `${currentPageTitle}-এর জীবনী ও সংক্ষিপ্ত পরিচিতি।`;
  const shareImage = frontmatter.og_image || frontmatter.image || siteData.ogImage;

  return {
    title: dynamicMetaTitle,
    description,
    openGraph: {
      title: dynamicMetaTitle,
      description,
      images: shareImage ? [{ url: shareImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicMetaTitle,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}
