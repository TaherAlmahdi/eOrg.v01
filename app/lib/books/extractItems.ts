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
      // সাব-ফোল্ডারে প্রবেশের সময় লেখক ইনফো পাস করা
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

        // নির্দিষ্ট লেখকের ফিল্টারিং (যদি পাঠানো হয়ে থাকে)
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