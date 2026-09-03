import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const booksDirectory = path.join(process.cwd(), 'content/books');

export interface LibraryItemEntry {
  itemType: string;       // যেমন: 'story', 'poem', 'essay'
  itemTypeSlug: string;   // ইউআরএল ফ্রেন্ডলি আইটেম টাইপ স্লাগ (যেমন: 'story', 'poem')
  title: string;          // আইটেমের নিজস্ব শিরোনাম (যেমন: 'চোখ', 'বিদ্রোহী')
  slug?: string;          // ফ্রন্টম্যাটারের নিজস্ব স্লাগ (যদি থাকে)
  titleSlug: string;      // আইটেমের চূড়ান্ত স্লাগ (Slug অথবা ফলব্যাক Title থেকে তৈরি)
  bookTitle: string;      // মূল বইয়ের নাম
  bookSlug: string;       // মূল বইয়ের স্লাগ
  author: string;         // লেখকের নাম
  authorSlug: string;     // লেখকের স্লাগ
  href: string;           // সিঙ্গেল আইটেম পড়ার ইউআরএল
  content: string;        // আইটেমের বিষয়বস্তু
  frontmatter: Record<string, any>;
}

// বাংলা ও ইংরেজি উভয় টেক্সট থেকে সঠিক স্লাগ তৈরির হেল্পার
function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF-]+/g, '')
    .replace(/--+/g, '-');
}

// ইংরেজি ম্যাপিং ফলব্যাক
const ITEM_SLUG_MAP: Record<string, string> = {
  'গল্প': 'story',
  'ছোটগল্প': 'story',
  'কবিতা': 'poem',
  'প্রবন্ধ': 'essay',
  'উপন্যাস': 'novel',
  'নাটক': 'drama',
  'অনুবাদ': 'translation',
};

function getItemSlug(itemType: string): string {
  const clean = itemType.trim();
  if (ITEM_SLUG_MAP[clean]) return ITEM_SLUG_MAP[clean];
  return slugify(clean);
}

function parseItemName(itemVal: any): string {
  if (!itemVal) return '';
  if (typeof itemVal === 'string') return itemVal.trim();
  if (typeof itemVal === 'object') {
    return (itemVal.name || itemVal.title || itemVal.label || '').trim();
  }
  return String(itemVal).trim();
}

function extractItemsFromData(data: Record<string, any>): string[] {
  const rawItem = data.item || data.items;
  if (!rawItem) return [];

  if (Array.isArray(rawItem)) {
    return rawItem.map(parseItemName).filter(Boolean);
  }
  
  const parsed = parseItemName(rawItem);
  return parsed ? [parsed] : [];
}

/**
 * সকল বই ও তার সাব-ফোল্ডার স্ক্যান করে 'item' যুক্ত সমস্ত ফাইল রিটার্ন করবে
 */
export async function getAllLibraryItems(): Promise<LibraryItemEntry[]> {
  const allItems: LibraryItemEntry[] = [];

  if (!existsSync(booksDirectory)) return allItems;

  try {
    const authorDirs = await fs.readdir(booksDirectory, { withFileTypes: true });

    for (const authorDir of authorDirs) {
      if (!authorDir.isDirectory()) continue;
      const authorFolderPath = path.join(booksDirectory, authorDir.name);

      const bookDirs = await fs.readdir(authorFolderPath, { withFileTypes: true });

      for (const bookDir of bookDirs) {
        if (!bookDir.isDirectory()) continue;
        const bookFolderPath = path.join(authorFolderPath, bookDir.name);
        const indexMdPath = path.join(bookFolderPath, 'index.md');

        if (!existsSync(indexMdPath)) continue;

        const bookIndexContent = await fs.readFile(indexMdPath, 'utf8');
        const { data: bookData } = matter(bookIndexContent);

        const bookTitle = bookData.title || bookDir.name;
        const bookSlug = bookData.slug ? String(bookData.slug).trim() : bookDir.name;
        const authorName = bookData.author || 'অজ্ঞাত লেখক';
        const authorSlug = bookData.authorSlug ? String(bookData.authorSlug).trim() : authorDir.name;

        // সাব-ফোল্ডারসহ সকল MD ফাইল রিকার্সিভলি স্ক্যান
        const scanRecursively = async (currentDir: string) => {
          const entries = await fs.readdir(currentDir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
              await scanRecursively(fullPath);
            } else if (
              entry.isFile() && 
              entry.name.endsWith('.md') && 
              entry.name.toLowerCase() !== 'index.md'
            ) {
              const fileContent = await fs.readFile(fullPath, 'utf8');
              const { data: fileData, content } = matter(fileContent);

              const itemTypes = extractItemsFromData(fileData);

              if (itemTypes.length > 0) {
                // আইটেমের টাইটেল নির্ধারণ
                const itemTitle = fileData.item_title || fileData.title || entry.name.replace(/\.md$/, '');
                
                // ✅ ফ্রন্টম্যাটারের slug সংগ্রহ
                const rawFrontmatterSlug = fileData.slug ? String(fileData.slug).trim() : undefined;

                // ✅ ১ম প্রায়োরিটি: ফ্রন্টম্যাটারের slug, না থাকলে ফলব্যাক হিসেবে টাইটেল বা ফাইলের নাম
                let titleSlug = rawFrontmatterSlug || slugify(itemTitle) || entry.name.replace(/\.md$/, '');

                itemTypes.forEach((type) => {
                  const itemTypeSlug = getItemSlug(type);
                  const href = `/items/${itemTypeSlug}/${encodeURIComponent(titleSlug)}`;

                  allItems.push({
                    itemType: type,
                    itemTypeSlug,
                    title: itemTitle,
                    slug: rawFrontmatterSlug,
                    titleSlug,
                    bookTitle,
                    bookSlug,
                    author: authorName,
                    authorSlug,
                    href,
                    content,
                    frontmatter: fileData,
                  });
                });
              }
            }
          }
        };

        await scanRecursively(bookFolderPath);
      }
    }
  } catch (error) {
    console.error('Error scanning library items:', error);
  }

  return allItems.sort((a, b) => a.title.localeCompare(b.title, 'bn'));
}

/**
 * নির্দিষ্ট Item Type এবং Title Slug দিয়ে সিঙ্গেল আইটেম ডাটা রিড করা (কেস ও ডিকোডিং সুরক্ষিত)
 */
export async function getItemByParams(itemSlug: string, titleSlug: string) {
  const allItems = await getAllLibraryItems();

  const decodedTargetItemSlug = decodeURIComponent(itemSlug).trim().toLowerCase();
  const decodedTargetTitleSlug = decodeURIComponent(titleSlug).trim();
  const lowerTargetTitleSlug = decodedTargetTitleSlug.toLowerCase();

  const currentIndex = allItems.findIndex((item) => {
    const currentItemTypeSlug = (item.itemTypeSlug || '').trim().toLowerCase();
    const currentTitleSlug = (item.titleSlug || '').trim();
    const currentTitleSlugLower = currentTitleSlug.toLowerCase();
    const currentFrontmatterSlug = (item.slug || '').trim();

    const isTypeMatch = currentItemTypeSlug === decodedTargetItemSlug;
    const isTitleMatch = 
      currentTitleSlug === decodedTargetTitleSlug || 
      currentTitleSlugLower === lowerTargetTitleSlug ||
      currentFrontmatterSlug === decodedTargetTitleSlug;

    return isTypeMatch && isTitleMatch;
  });

  if (currentIndex === -1) return null;

  const currentItem = allItems[currentIndex];
  
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  return {
    item: currentItem,
    navigation: {
      prev: prevItem ? { title: prevItem.title, href: prevItem.href } : null,
      next: nextItem ? { title: nextItem.title, href: nextItem.href } : null,
    },
  };
}