import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';

const booksDirectory = path.join(process.cwd(), 'content/books');

export interface LibraryItemEntry {
  itemType: string;        
  itemTypeSlug: string;    
  title: string;           
  slug?: string;           
  titleSlug: string;       
  bookTitle: string;       
  bookSlug: string;        
  author: string | string[];       
  authorSlug: string;      
  translator?: string | string[];  
  editor?: string | string[];      
  href: string;            
  content: string;         
  frontmatter: Record<string, any>;
}

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

// 🔹 একাধিক অনুবাদক, লেখক বা সম্পাদককে স্ট্রিং বা অ্যারে আকারে নিরাপদে পার্স করার ফাংশন
function parseContributorField(val: any, fallback?: string): string | string[] | undefined {
  if (!val) return fallback;
  if (Array.isArray(val)) {
    const cleaned = val.map((v) => parseItemName(v)).filter(Boolean);
    if (cleaned.length === 0) return fallback;
    return cleaned.length === 1 ? cleaned[0] : cleaned; // একটি উপাদান থাকলে সরাসরি স্ট্রিং, একাধিক থাকলে অ্যারে রিটার্ন করবে
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const str = String(val).trim();
    return str || fallback;
  }
  return fallback;
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
        
        const rawAuthor = bookData.author || bookData.author_name || bookData.writer || bookData.authors;
        const rawTranslator = bookData.translator || bookData.translator_name || bookData.translators;
        const rawEditor = bookData.editor || bookData.editor_name || bookData.editors;

        const authorName = parseContributorField(rawAuthor, 'অজ্ঞাত লেখক')!;
        const translatorName = parseContributorField(rawTranslator);
        const editorName = parseContributorField(rawEditor);

        const authorSlug = bookData.authorSlug ? String(bookData.authorSlug).trim() : authorDir.name;

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
                const itemTitle = fileData.item_title || fileData.title || entry.name.replace(/\.md$/, '');
                const rawFrontmatterSlug = fileData.slug ? String(fileData.slug).trim() : undefined;
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
                    translator: translatorName,
                    editor: editorName,
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