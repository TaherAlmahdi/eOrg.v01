import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BOOKS_DIRECTORY = path.join(process.cwd(), 'content/books');
const ALTERNATE_BOOKS_DIRECTORY = path.join(process.cwd(), 'content/books');

/**
 * Frontmatter ডাটা থেকে Item/Item Types এক্সট্র্যাক্ট করার উন্নত হেল্পার
 */
function extractItemTypesFromFrontmatter(data: Record<string, any>): string[] {
  if (!data || typeof data !== 'object') return [];

  const itemsSet = new Set<string>();

  // সম্ভাব্য সকল ফ্রন্টম্যাটার কি (Keys)
  const rawItems = data.item || data.items || data.itemTypes || data.item_items || data.subPages;

  const processItem = (val: any) => {
    if (!val) return;
    if (typeof val === 'string' && val.trim()) {
      itemsSet.add(val.trim());
    } else if (Array.isArray(val)) {
      val.forEach(processItem);
    } else if (typeof val === 'object' && val !== null) {
      // অবজেক্ট হলে সম্ভাব্য সব প্রপার্টি চেক করা
      const foundName = val.type || val.item || val.name || val.title || val.category || val.slug;
      if (foundName && typeof foundName === 'string' && foundName.trim()) {
        itemsSet.add(foundName.trim());
      }
    }
  };

  processItem(rawItems);

  return Array.from(itemsSet);
}

/**
 * ফোল্ডার, সাব-ফোল্ডারের সমস্ত .md ফাইল স্ক্যান করার ফাংশন
 */
function scanDirectoryRecursively(
  dirPath: string,
  authorSlugFilter?: string,
  inheritedAuthor?: string
): string[] {
  const itemSet = new Set<string>();

  if (!existsSync(dirPath)) return [];

  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const subItems = scanDirectoryRecursively(fullPath, authorSlugFilter, inheritedAuthor);
      subItems.forEach((item) => itemSet.add(item));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      try {
        const fileContent = readFileSync(fullPath, 'utf8');
        const { data: frontmatter } = matter(fileContent);

        const currentAuthor =
          frontmatter.authorSlug ||
          frontmatter.author_slug ||
          frontmatter.author ||
          inheritedAuthor;

        if (authorSlugFilter && authorSlugFilter !== 'library') {
          if (
            !currentAuthor ||
            String(currentAuthor).toLowerCase() !== String(authorSlugFilter).toLowerCase()
          ) {
            continue;
          }
        }

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
 * প্রধান এক্সপোর্ট ফাংশন (ইউনিক আইটেম লিস্ট)
 */
export function getAllExtractedItems(authorSlug?: string): string[] {
  let targetDir = BOOKS_DIRECTORY;
  if (!existsSync(targetDir) && existsSync(ALTERNATE_BOOKS_DIRECTORY)) {
    targetDir = ALTERNATE_BOOKS_DIRECTORY;
  }

  return scanDirectoryRecursively(targetDir, authorSlug);
}

// =========================================================================
// রিফ্যাক্টর্ড আইটেম কাউন্টিং লজিক
// =========================================================================

/**
 * ফোল্ডার স্ক্যান করে প্রতিটি ইউনিক আইটেমের কাউন্ট হিসেব করে
 */
function scanDirectoryRecursivelyForCounts(
  dirPath: string,
  itemCountsMap: Map<string, number>,
  authorSlugFilter?: string,
  inheritedAuthor?: string
): void {
  if (!existsSync(dirPath)) return;

  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // ডিরেক্টরির নিজস্ব কোনো লেখক থাকলে তা সাব-ডিরেক্টরির জন্য পাস হবে
      scanDirectoryRecursivelyForCounts(fullPath, itemCountsMap, authorSlugFilter, inheritedAuthor);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      try {
        const fileContent = readFileSync(fullPath, 'utf8');
        const { data: frontmatter } = matter(fileContent);

        const currentAuthor =
          frontmatter.authorSlug ||
          frontmatter.author_slug ||
          frontmatter.author ||
          inheritedAuthor;

        // নির্দিষ্ট লেখকের ফিল্টারিং (যদি দেওয়া থাকে)
        if (authorSlugFilter && authorSlugFilter !== 'library') {
          if (
            !currentAuthor ||
            String(currentAuthor).toLowerCase() !== String(authorSlugFilter).toLowerCase()
          ) {
            continue;
          }
        }

        const extractedItems = extractItemTypesFromFrontmatter(frontmatter);

        // একটি নির্দিষ্ট ফাইলের মধ্যে একাধিকবার একই আইটেম থাকলে যেন ১ বার গণনা হয়
        const uniqueItemsInFile = new Set(extractedItems);

        uniqueItemsInFile.forEach((item) => {
          itemCountsMap.set(item, (itemCountsMap.get(item) || 0) + 1);
        });

      } catch (err) {
        // ফাইল রিড এরর ইগনোর
      }
    }
  }
}

/**
 * আইটেমের নাম এবং তার সঠিক কাউন্ট সহ অবজেক্ট অ্যারে রিটার্ন করে
 */
export function getAllExtractedItemsWithCounts(authorSlug?: string): Array<{ name: string; count: number }> {
  let targetDir = BOOKS_DIRECTORY;
  if (!existsSync(targetDir) && existsSync(ALTERNATE_BOOKS_DIRECTORY)) {
    targetDir = ALTERNATE_BOOKS_DIRECTORY;
  }

  const itemCountsMap = new Map<string, number>();
  scanDirectoryRecursivelyForCounts(targetDir, itemCountsMap, authorSlug);

  return Array.from(itemCountsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'bn'));
}