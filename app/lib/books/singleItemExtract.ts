// app\lib\books\singleItemExtract.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BOOKS_DIRECTORY = path.join(process.cwd(), 'content/books');

// সাব-ফোল্ডার ও সাব-সাব-ফোল্ডারসহ সব .md ফাইল খুঁজে বের করার রিকার্সিভ ফাংশন
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

// ফ্রন্টমেটার থেকে নির্দিষ্ট item বা ক্যাটাগরি অনুযায়ী আইটেম/বই খুঁজে বের করার ফাংশন
export async function getItemsByItemType(targetItemType?: string) {
  const markdownFiles = getAllMarkdownFiles(BOOKS_DIRECTORY);
  const items: any[] = [];

  for (const filePath of markdownFiles) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content } = matter(fileContent);

    // সাব-ফোল্ডারের পাথ থেকে ইউনিক স্লাগ তৈরি (যেমন: story/chokh)
    const relativePath = path.relative(BOOKS_DIRECTORY, filePath);
    const slug = relativePath.replace(/\.md$/, '').replace(/\\/g, '/');

    if (targetItemType) {
      if (frontmatter.item === targetItemType || frontmatter.type === targetItemType) {
        items.push({
          slug,
          ...frontmatter,
          content,
        });
      }
    } else {
      items.push({
        slug,
        ...frontmatter,
        content,
      });
    }
  }

  return items;
}

// নির্দিষ্ট কোনো স্লাগ বা নেস্টেড পাথ দিয়ে একক আইটেম/বই খোঁজার ফাংশন
export async function getBookBySlug(slug: string | string[]) {
  const normalizedSlug = Array.isArray(slug) ? slug.join('/') : slug;
  const targetPath = path.join(BOOKS_DIRECTORY, `${normalizedSlug}.md`);

  if (!fs.existsSync(targetPath)) {
    return null;
  }

  const fileContent = fs.readFileSync(targetPath, 'utf8');
  const { data: frontmatter, content } = matter(fileContent);

  return {
    slug: normalizedSlug,
    ...frontmatter,
    content,
  } as {
    slug: string;
    title: string;
    subtitle?: string;
    author?: string;
    translator?: string;
    editor?: string;
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
    cover_image?: string;
    rawFrontmatter?: Record<string, unknown>;
    content: string;
    [key: string]: any;
  };
}