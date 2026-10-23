// app/lib/books/hierarchy.ts
import { BookHierarchy, computeBookHierarchy, tocManifestKey } from './hierarchy-core';
import { getAssetsBucket, readTextFromR2 } from './r2';

/**
 * একটা prefix-এর নিচে থাকা সব R2 key রিকার্সিভভাবে লিস্ট করে
 * (fs.readdirSync-এর বদলে ব্যবহার হবে — R2-তে আসল ফোল্ডার নেই, সব ফ্ল্যাট key)
 */
async function listKeysUnderPrefix(prefix: string): Promise<string[]> {
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

/** The toc built by sync-assets (_manifest/toc/...): one small file instead of reading every chapter. */
async function readPrebuiltHierarchy(bookPrefix: string, bookSlug: string): Promise<BookHierarchy | null> {
  try {
    const bucket = await getAssetsBucket();
    const obj = await bucket.get(tocManifestKey(bookPrefix));
    if (!obj) return null;
    const toc = JSON.parse(await obj.text()) as BookHierarchy & { bookSlug?: string };
    return toc.bookSlug === bookSlug && Array.isArray(toc.nodes) ? toc : null;
  } catch (err) {
    console.error('toc manifest পড়তে ব্যর্থ:', err);
    return null;
  }
}

export async function getBookHierarchy(
  bookPrefix: string, // যেমন: "books/bankim/durgeshnandini/"
  bookSlug: string // URL-এ ব্যবহৃত বইয়ের slug (href বানাতে লাগে)
): Promise<BookHierarchy> {
  const prebuilt = await readPrebuiltHierarchy(bookPrefix, bookSlug);
  if (prebuilt) return prebuilt;

  // Slow fallback (until the first sync that writes the toc): list the book and read every chapter
  const allKeys = await listKeysUnderPrefix(bookPrefix);
  return computeBookHierarchy(bookPrefix, bookSlug, allKeys, readTextFromR2);
}
