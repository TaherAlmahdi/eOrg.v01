// app/lib/books/items.ts
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const booksDirectory = path.join(process.cwd(), 'content/books');

export interface LibraryItemEntry {
  itemType: string;       // যেমন: 'story', 'poem', 'essay' (ফ্রন্টম্যাটারের item প্রপার্টি থেকে)
  itemTypeSlug: string;   // ইউআরএল ফ্রেন্ডলি আইটেম টাইপ স্লাগ (যেমন: /items/story)
  title: string;          // আইটেমের নিজস্ব শিরোনাম (যেমন: 'চোখ', 'বিদ্রোহী')
  titleSlug: string;      // আইটেমের শিরোনাম স্লাগ (যেমন: 'chok', 'bidrohi')
  bookTitle: string;      // মূল বইয়ের নাম
  bookSlug: string;       // মূল বইয়ের স্লাগ
  author: string;         // লেখকের নাম
  authorSlug: string;     // লেখকের স্লাগ
  href: string;           // সিঙ্গেল আইটেম পড়ার ইউআরএল (/items/[itemSlug]/[title])
  content: string;        // আইটেমের বিষয়বস্তু
  frontmatter: Record<string, any>;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF-]+/g, '')
    .replace(/--+/g, '-');
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
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
              const fileContent = await fs.readFile(fullPath, 'utf8');
              const { data: fileData, content } = matter(fileContent);

              const rawItem = fileData.item || fileData.items;

              if (rawItem) {
                const itemTypes = Array.isArray(rawItem)
                  ? rawItem.map((i) => String(i).trim())
                  : [String(rawItem).trim()];

                const itemTitle = fileData.item_title || fileData.title || entry.name.replace(/\.md$/, '');
                const titleSlug = fileData.slug ? String(fileData.slug).trim() : slugify(itemTitle);

                itemTypes.forEach((type) => {
                  const itemTypeSlug = slugify(type);
                  // ইউআরএল কাঠামো: /items/[itemSlug]/[title]
                  const href = `/items/${itemTypeSlug}/${titleSlug}`;

                  allItems.push({
                    itemType: type,
                    itemTypeSlug,
                    title: itemTitle,
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
 * নির্দিষ্ট Item Type (যেমন: story, poem) এবং Title Slug দিয়ে সিঙ্গেল আইটেম ডাটা রিড করা
 */
export async function getItemByParams(itemSlug: string, titleSlug: string) {
  const allItems = await getAllLibraryItems();

  const currentIndex = allItems.findIndex(
    (item) => item.itemTypeSlug === itemSlug && item.titleSlug === titleSlug
  );

  if (currentIndex === -1) return null;

  const currentItem = allItems[currentIndex];
  
  // সিকোয়েনশিয়াল নেভিগেশন (এক আইটেম থেকে অন্য আইটেমে যাওয়া)
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

// app/lib/books/items.ts

/**
 * ফ্রন্টম্যাটার থেকে নাম (String) বের করার সেফ হেল্পার
 */
function parseItemName(itemVal: any): string {
  if (!itemVal) return '';
  if (typeof itemVal === 'string') return itemVal.trim();
  if (typeof itemVal === 'object') {
    // যদি ফ্রন্টম্যাটারে { name: "গল্প", link: "..." } আকারে থাকে
    return (itemVal.name || itemVal.title || itemVal.label || '').trim();
  }
  return String(itemVal).trim();
}

/**
 * ফ্রন্টম্যাটার থেকে item/items ফিল্ডকে নরম্যালাইজড অ্যারে অফ স্ট্রিং-এ রূপান্তর
 */
function extractItemsFromData(data: Record<string, any>): string[] {
  const rawItem = data.item || data.items;
  if (!rawItem) return [];

  if (Array.isArray(rawItem)) {
    return rawItem.map(parseItemName).filter(Boolean);
  }
  
  const parsed = parseItemName(rawItem);
  return parsed ? [parsed] : [];
}