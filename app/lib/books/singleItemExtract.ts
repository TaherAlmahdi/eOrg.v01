// app/lib/books/singleItemExtract.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getAllLibraryItems, getItemByParams, LibraryItemEntry } from './items';

const BOOKS_DIRECTORY = path.join(process.cwd(), 'content/books');

/**
 * ১. সিঙ্গেল আইটেমের জন্য সুনির্দিষ্ট টাইপ ডেফিনিশন (TypeScript Interface)
 */
export interface SingleBookItem {
  slug: string;
  title: string;
  subtitle?: string;
  author?: string;
  authorSlug?: string;
  bookTitle?: string;
  bookSlug?: string;
  itemType?: string;
  itemTypeSlug?: string;
  href?: string;
  translator?: string;
  editor?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  cover_image?: string;
  rawFrontmatter?: Record<string, any>;
  content: string;
  [key: string]: any;
}

// সাব-ফোল্ডার ও সাব-সাব-ফোল্ডারসহ সব .md ফাইল খুঁজে বের করার রিকার্সিভ ফাংশন (সিঙ্ক্রোনাস)
function getAllMarkdownFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllMarkdownFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.md')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

/**
 * ২. ফ্রন্টমেটার বা আইটেম টাইপ অনুযায়ী আইটেম খুঁজে বের করার ফাংশন
 */
export async function getItemsByItemType(targetItemType?: string) {
  const allLibraryItems = await getAllLibraryItems();

  if (!targetItemType) {
    return allLibraryItems.map((item) => ({
      slug: item.titleSlug,
      title: item.title,
      author: item.author,
      bookTitle: item.bookTitle,
      content: item.content,
      ...item.frontmatter,
    }));
  }

  const cleanTargetType = targetItemType.trim().toLowerCase();

  const filtered = allLibraryItems.filter((item) => {
    const type = item.itemType ? item.itemType.toLowerCase() : '';
    const typeSlug = item.itemTypeSlug ? item.itemTypeSlug.toLowerCase() : '';
    return type === cleanTargetType || typeSlug === cleanTargetType;
  });

  return filtered.map((item) => ({
    slug: item.titleSlug,
    title: item.title,
    author: item.author,
    bookTitle: item.bookTitle,
    content: item.content,
    ...item.frontmatter,
  }));
}

/**
 * ৩. যেকোনো স্লাগ দিয়ে সিঙ্গেল আইটেম খোঁজার অল-ইন-ওয়ান সমাধান
 */
export async function getBookBySlug(slug: string | string[]): Promise<SingleBookItem | null> {
  const rawSlug = Array.isArray(slug) ? slug.join('/') : slug;
  const decodedSlug = decodeURIComponent(rawSlug).trim().toLowerCase();

  // স্লাগের শেষ অংশ আলাদা করা (যেমন: /items/story/chokh থেকে 'chokh')
  const slugSegments = decodedSlug.split('/').filter(Boolean);
  const lastSegment = slugSegments[slugSegments.length - 1] || decodedSlug;

  // ১. মেথড: items.ts-এর পার্স করা ডাটা থেকে খোঁজা (সবচেয়ে নির্ভুল)
  const allItems = await getAllLibraryItems();

  const matchedItem = allItems.find((entry) => {
    const tSlug = entry.titleSlug ? entry.titleSlug.toLowerCase() : '';
    const href = entry.href ? entry.href.toLowerCase() : '';
    const fileSlug = entry.frontmatter.slug ? String(entry.frontmatter.slug).toLowerCase() : '';

    return (
      tSlug === decodedSlug ||
      tSlug === lastSegment ||
      fileSlug === decodedSlug ||
      fileSlug === lastSegment ||
      href.endsWith(`/${lastSegment}`) ||
      href.includes(decodedSlug)
    );
  });

  if (matchedItem) {
    return {
      slug: matchedItem.titleSlug,
      title: matchedItem.title,
      subtitle: matchedItem.frontmatter.subtitle || '',
      author: matchedItem.author,
      authorSlug: matchedItem.authorSlug,
      bookTitle: matchedItem.bookTitle,
      bookSlug: matchedItem.bookSlug,
      itemType: matchedItem.itemType,
      itemTypeSlug: matchedItem.itemTypeSlug,
      href: matchedItem.href,
      translator: matchedItem.frontmatter.translator || '',
      editor: matchedItem.frontmatter.editor || '',
      meta_title: matchedItem.frontmatter.meta_title || matchedItem.title,
      meta_description: matchedItem.frontmatter.meta_description || '',
      og_image: matchedItem.frontmatter.og_image || '',
      cover_image: matchedItem.frontmatter.cover_image || '',
      rawFrontmatter: matchedItem.frontmatter,
      content: matchedItem.content,
      ...matchedItem.frontmatter,
    };
  }

  // ২. ফলব্যাক মেথড: যদি সরাসরি ফাইল পাথ দিয়ে খোঁজা হয়
  const targetPath = path.join(BOOKS_DIRECTORY, `${decodedSlug}.md`);
  if (fs.existsSync(targetPath)) {
    const fileContent = fs.readFileSync(targetPath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);

    return {
      slug: decodedSlug,
      title: frontmatter.title || lastSegment,
      content,
      rawFrontmatter: frontmatter,
      ...frontmatter,
    };
  }

  // ৩. ফলব্যাক মেথড: পুরো content/books ডিরেক্টরি রিকার্সিভলি ফিল্টার করা
  const allFiles = getAllMarkdownFiles(BOOKS_DIRECTORY);
  for (const filePath of allFiles) {
    const fileName = path.basename(filePath, '.md').toLowerCase();
    if (fileName === lastSegment) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content } = matter(fileContent);

      return {
        slug: frontmatter.slug || fileName,
        title: frontmatter.title || fileName,
        content,
        rawFrontmatter: frontmatter,
        ...frontmatter,
      };
    }
  }

  return null;
}