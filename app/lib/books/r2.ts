// app/lib/books/r2.ts
import { COVER_BASE } from '@/app/lib/cover-base';
import type { FrontmatterValue } from '@/app/lib/frontmatter';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import matter from "gray-matter";
import { setSlugManifest, type SlugTable } from "@/app/lib/content/core/registry/slug-store";

const MANIFEST_KEY = '_manifest/books-index.json';
const SLUGS_MANIFEST_KEY = '_manifest/slugs.json';

/**
 * একমাত্র R2 bucket (binding: ASSETS_BUCKET)
 */
export async function getAssetsBucket() {
  // Dev only: read books from the local books folder (CONTENT_ROOT) instead of R2.
  // The literal NODE_ENV check lets the bundler drop this branch from production builds.
  if (process.env.NODE_ENV === 'development' && process.env.CONTENT_ROOT) {
    const { getLocalBucket } = await import('@/lib/catalog/local-provider');
    return getLocalBucket();
  }
  const { env } = await getCloudflareContext({ async: true });
  return env.ASSETS_BUCKET;
}

/**
 * ASSETS_BUCKET থেকে একটা key-এর টেক্সট কনটেন্ট পড়ে।
 * 🌟 মনে রাখবেন: TOC এবং ফ্রন্টম্যাটার রিডিংয়ের জন্য র টেক্সট (Frontmatter সহ) প্রয়োজন হয়, 
 * তাই শুধু বডি আলাদা না করে পুরো টেক্সট রিটার্ন করা নিরাপদ। কন্টেন্ট রেন্ডার করার সময় 
 * আলাদাভাবে matter() দিয়ে বডি বের করে নেওয়া ভালো।
 */
export async function readTextFromR2(key: string): Promise<string | null> {
  const bucket = await getAssetsBucket();
  const obj = await bucket.get(key);
  if (!obj) return null;
  return await obj.text();
}

/**
 * ASSETS_BUCKET-এ একটা key আসলেই আছে কিনা চেক করে
 */
export async function existsInR2(key: string): Promise<boolean> {
  const bucket = await getAssetsBucket();
  const head = await bucket.head(key);
  return head !== null;
}

/**
 * একটা prefix-এর নিচে থাকা সব R2 key রিকার্সিভভাবে লিস্ট করে
 */
export async function listKeysUnderPrefix(prefix: string): Promise<string[]> {
  const bucket = await getAssetsBucket();
  const keys: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const result: R2Objects = await bucket.list({ prefix, cursor });
    for (const obj of result.objects) {
      keys.push(obj.key);
    }
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return keys;
}

/**
 * প্রি-বিল্ট manifest ফাইল পড়ে। 
 * 🌟 ক্যাশ সমস্যা দূর করতে ডাইনামিক ফেচিং এবং নো-ক্যাশ অপশন নিশ্চিত করা হয়েছে,
 * যাতে নতুন বই বা কভার আপলোড করলেই তা রিয়েল-টাইমে পাওয়া যায়।
 */
let cachedManifest: FrontmatterValue[] | null = null;
let lastManifestFetchTime = 0;
const MANIFEST_CACHE_TTL = 30 * 1000; // ৩০ সেকেন্ড ক্যাশ লাইফটাইম (অথবা প্রয়োজনমতো কমাতে পারেন)

export async function getManifest(forceRefresh = false): Promise<FrontmatterValue[]> {
  await loadSlugManifest();
  const now = Date.now();
  if (cachedManifest && !forceRefresh && (now - lastManifestFetchTime < MANIFEST_CACHE_TTL)) {
    return cachedManifest;
  }

  try {
    const bucket = await getAssetsBucket();
    // ক্যাশ এড়াতে R2 থেকে লেটেস্ট অবজেক্ট ফেচ করা
    const obj = await bucket.get(MANIFEST_KEY);
    if (!obj) return [];

    const raw = await obj.text();
    if (!raw) return [];

    cachedManifest = JSON.parse(raw);
    lastManifestFetchTime = now;
    return cachedManifest!;
  } catch (err) {
    console.error('manifest পার্স করতে ব্যর্থ:', err);
    return cachedManifest || [];
  }
}

/**
 * Loads the slug manifest (_manifest/slugs.json, written by sync-assets) into the slug store.
 * The slug helpers are synchronous, so every page loads this (directly, or through getManifest /
 * getAllLibraryItems) before it looks a slug up. Cached for 30 seconds; if the file is missing
 * or unreadable the hand-written registry in slug-data.ts keeps working.
 */
let lastSlugLoad = 0;
let slugLoad: Promise<void> | null = null;
export async function loadSlugManifest(): Promise<void> {
  if (Date.now() - lastSlugLoad < MANIFEST_CACHE_TTL) return;
  slugLoad ??= (async () => {
    try {
      const bucket = await getAssetsBucket();
      const obj = await bucket.get(SLUGS_MANIFEST_KEY);
      const raw = obj ? await obj.text() : '';
      if (raw) setSlugManifest(JSON.parse(raw) as Partial<SlugTable>);
    } catch (err) {
      console.error('slug manifest লোড করতে ব্যর্থ:', err);
    } finally {
      lastSlugLoad = Date.now();
      slugLoad = null;
    }
  })();
  await slugLoad;
}

/**
 * কভার ছবির পাবলিক URL বানায় — eduliture-assets bucket-এর cover/ প্রিফিক্স ধরে।
 * 🌟 ব্রাউজার ক্যাশ বাইপাস করতে চাইলে ডেভেলপমেন্ট বা রিমোট ইউআরএলের সাথে টাইমস্ট্যাম্প বা ভার্সন যুক্ত করা যেতে পারে।
 */
export function getCoverUrl(coverName?: string | null): string {
  if (!coverName) return `${COVER_BASE}/cover/default-cover.webp`;

  // ১. যদি ইতোমধ্যে সম্পূর্ণ URL (http/https) হয়ে থাকে
  if (coverName.startsWith('http://') || coverName.startsWith('https://')) {
    return coverName;
  }

  // ২. স্ল্যাশ ও স্পেস পরিচ্ছন্ন করা
  let cleanPath = coverName.trim().replace(/\\/g, '/');

  // 'public/' বা '/public/' রিমুভ করা
  if (cleanPath.startsWith('public/')) {
    cleanPath = cleanPath.replace('public/', '');
  } else if (cleanPath.startsWith('/public/')) {
    cleanPath = cleanPath.replace('/public/', '');
  }

  cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

  // ৩. ডাবল এক্সটেনশন সমস্যা দূর করা
  cleanPath = cleanPath.replace(/\.(webp|jpg|png)\.(webp|jpg|png)$/i, '.$1');

  // ৪. যদি ফাইল নামের শেষে কোনো এক্সটেনশন না থাকে, তবে .webp যোগ করা
  if (!/\.(webp|jpg|jpeg|png)$/i.test(cleanPath)) {
    cleanPath = `${cleanPath}.webp`;
  }

  // ৫. যদি পাথে ইতিমধ্যে 'cover/' ফোল্ডার যুক্ত থাকে
  if (cleanPath.startsWith('cover/')) {
    return `${COVER_BASE}/${cleanPath}`;
  }

  // ৬. অন্যথায় সামনে 'cover/' ফোল্ডার যুক্ত করা
  return `${COVER_BASE}/cover/${cleanPath}`;
}