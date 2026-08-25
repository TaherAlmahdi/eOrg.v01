import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BOOKS_DIRECTORY = path.join(process.cwd(), 'content/books');
const ALTERNATE_BOOKS_DIRECTORY = path.join(process.cwd(), 'app/content/books');

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
    } else if (typeof val === 'object' && val !== null) {
      // অবজেক্ট হলে সম্ভাব্য সব প্রপার্টি চেক করা
      const foundName = val.type || val.item || val.name || val.title || val.category || val.slug;
      if (foundName && typeof foundName === 'string' && foundName.trim()) {
        itemsSet.add(foundName.trim());
      }
    }
  };

  if (Array.isArray(rawItems)) {
    rawItems.forEach(processItem);
  } else {
    processItem(rawItems);
  }

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
      // সাব-ফোল্ডারে প্রবেশের সময় লেখক ইনফো পাস করা
      const subItems = scanDirectoryRecursively(fullPath, authorSlugFilter, inheritedAuthor);
      subItems.forEach((item) => itemSet.add(item));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      try {
        const fileContent = readFileSync(fullPath, 'utf8');
        const { data: frontmatter } = matter(fileContent);

        // ফাইল বা প্যারেন্ট ডিরেক্টরি থেকে লেখক শনাক্তকরণ
        const currentAuthor =
          frontmatter.authorSlug ||
          frontmatter.author_slug ||
          frontmatter.author ||
          inheritedAuthor;

        // নির্দিষ্ট লেখকের ফিল্টারিং (যদি পাঠানো হয়ে থাকে)
        if (authorSlugFilter && authorSlugFilter !== 'library') {
          if (
            !currentAuthor ||
            String(currentAuthor).toLowerCase() !== String(authorSlugFilter).toLowerCase()
          ) {
            continue; // লেখক না মিললে স্কিপ
          }
        }

        // ফ্রন্টম্যাটার থেকে আইটেম রিড করা
        const extractedItems = extractItemTypesFromFrontmatter(frontmatter);
        extractedItems.forEach((item) => itemSet.add(item));

        // পরবর্তী সাব-ফাইলের জন্য লেখক মনে রাখা (যদি এই ফাইলে থাকে)
        if (currentAuthor) {
          inheritedAuthor = currentAuthor;
        }
      } catch (err) {
        // ফাইল রিড এরর ইগনোর
      }
    }
  }

  return Array.from(itemSet);
}

/**
 * প্রধান এক্সপোর্ট ফাংশন
 */
export function getAllExtractedItems(authorSlug?: string): string[] {
  let targetDir = BOOKS_DIRECTORY;
  if (!existsSync(targetDir) && existsSync(ALTERNATE_BOOKS_DIRECTORY)) {
    targetDir = ALTERNATE_BOOKS_DIRECTORY;
  }

  return scanDirectoryRecursively(targetDir, authorSlug);
}

// =========================================================================
// অতিরিক্ত ফাংশন: বর্তমান লজিক পরিবর্তন না করে আইটেমের সঠিক কাউন্ট (সংখ্যা) বের করার জন্য
// =========================================================================

/**
 * ফোল্ডার স্ক্যান করে প্রতিটি আইটেম কতবার (কোন কোন পাতায়) এসেছে তা গণনা করে Map রিটার্ন করে
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

        if (authorSlugFilter && authorSlugFilter !== 'library') {
          if (
            !currentAuthor ||
            String(currentAuthor).toLowerCase() !== String(authorSlugFilter).toLowerCase()
          ) {
            continue;
          }
        }

        // একেকটি ফাইলের ফ্রন্টম্যাটার থেকে আইটেমগুলো নিয়ে কাউন্ট বাড়িয়ে দেওয়া
        const extractedItems = extractItemTypesFromFrontmatter(frontmatter);
        extractedItems.forEach((item) => {
          itemCountsMap.set(item, (itemCountsMap.get(item) || 0) + 1);
        });

        if (currentAuthor) {
          inheritedAuthor = currentAuthor;
        }
      } catch (err) {
        // ফাইল রিড এরর ইগনোর
      }
    }
  }
}

/**
 * আইটেমের নাম এবং তার সঠিক কাউন্ট সহ অবজেক্ট অ্যারে রিটার্ন করবে
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
    .sort((a, b) => b.count - a.count); // সর্বাধিক ব্যবহৃত আইটেমগুলো প্রথমে রাখার জন্য
}