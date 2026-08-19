import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

// প্রজেক্টের কন্টেন্ট ডিরেক্টরি
const BOOKS_DIRECTORY = path.join(process.cwd(), 'content/books');
const ALTERNATE_BOOKS_DIRECTORY = path.join(process.cwd(), 'app/content/books');

/**
 * যেকোনো Frontmatter ডাটা থেকে বিশুদ্ধ Item Type (যেমন: 'story', 'poem', 'essay' বা 'গল্প', 'কবিতা') এক্সট্র্যাক্ট করার হেল্পার
 */
function extractItemTypesFromFrontmatter(data: Record<string, any>): string[] {
  if (!data || typeof data !== 'object') return [];

  const itemsSet = new Set<string>();

  // কেবল আইটেম সম্পর্কিত ফিল্ডগুলো চেক করা হচ্ছে
  const rawItems = data.item || data.items || data.itemTypes || data.item_items;

  if (typeof rawItems === 'string' && rawItems.trim()) {
    itemsSet.add(rawItems.trim());
  } else if (Array.isArray(rawItems)) {
    rawItems.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        itemsSet.add(item.trim());
      } else if (typeof item === 'object' && item !== null) {
        const name = item.name || item.title || item.type || item.slug;
        if (name && typeof name === 'string') itemsSet.add(name.trim());
      }
    });
  }

  return Array.from(itemsSet);
}

/**
 * রিকার্সিভলি ফোল্ডার, সাব-ফোল্ডার ও গ্র্যান্ড-সাব-ফোল্ডারের সমস্ত .md ফাইল স্ক্যান করার ফাংশন
 */
function scanDirectoryRecursively(dirPath: string, authorSlugFilter?: string): string[] {
  const itemSet = new Set<string>();

  if (!existsSync(dirPath)) return [];

  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // গভীরে (সাব-ফোল্ডার / গ্র্যান্ড-সাব-ফোল্ডারে) প্রবেশের জন্য রিকার্সিভ কল
      const subItems = scanDirectoryRecursively(fullPath, authorSlugFilter);
      subItems.forEach((item) => itemSet.add(item));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // 🟢 মূল বইয়ের index.md ফাইল বাদ দিয়ে কেবল ভেতরের আইটেম ফাইল পড়া হচ্ছে
      if (entry.name.toLowerCase() === 'index.md') continue;

      try {
        const fileContent = readFileSync(fullPath, 'utf8');
        const { data: frontmatter } = matter(fileContent);

        // নির্দিষ্ট লেখকের জন্য ফিল্টারিং (যদি পাঠানো হয়)
        if (authorSlugFilter && authorSlugFilter !== 'library') {
          const fileAuthor =
            frontmatter.authorSlug ||
            frontmatter.author_slug ||
            frontmatter.author;
          if (
            !fileAuthor ||
            String(fileAuthor).toLowerCase() !== String(authorSlugFilter).toLowerCase()
          ) {
            continue; // অন্য লেখকের ফাইল হলে স্কিপ করা হবে
          }
        }

        // ফন্টম্যাটার থেকে আইটেম রিড করা
        const extractedItems = extractItemTypesFromFrontmatter(frontmatter);
        extractedItems.forEach((item) => itemSet.add(item));
      } catch (err) {
        // ফাইল রিড এরর ইগনোর
      }
    }
  }

  return Array.from(itemSet);
}

/**
 * 🟢 প্রধান এক্সপোর্ট ফাংশন: এটি আপনি আপনার books.ts বা অন্যান্য পেজে এক্সপোর্ট ও ইম্পোর্ট করবেন
 * @param authorSlug - (Optional) কোনো নির্দিষ্ট লেখকের স্লাগ
 * @returns স্ক্যানকৃত সকল অনন্য (Unique) আইটেমের অ্যারেই
 */
export function getAllExtractedItems(authorSlug?: string): string[] {
  // পাথ চেক করা (content/books নাকি app/content/books)
  let targetDir = BOOKS_DIRECTORY;
  if (!existsSync(targetDir) && existsSync(ALTERNATE_BOOKS_DIRECTORY)) {
    targetDir = ALTERNATE_BOOKS_DIRECTORY;
  }

  return scanDirectoryRecursively(targetDir, authorSlug);
}