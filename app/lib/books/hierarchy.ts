import fs from 'fs/promises';
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BookNode, VolumeItem, ChapterItem } from './types';
import { booksDirectory, naturalSort, extractItemsFromData } from './utils';

export async function getBookDirectoryBySlug(bookSlug: string): Promise<string | null> {
  if (!existsSync(booksDirectory)) return null;

  try {
    const authorItems = await fs.readdir(booksDirectory, { withFileTypes: true });

    for (const authorItem of authorItems) {
      if (!authorItem.isDirectory()) continue;

      const authorFolderPath = path.join(booksDirectory, authorItem.name);
      const bookItems = await fs.readdir(authorFolderPath, { withFileTypes: true });

      for (const bookItem of bookItems) {
        if (!bookItem.isDirectory()) continue;

        const bookFolderPath = path.join(authorFolderPath, bookItem.name);
        const indexMdPath = path.join(bookFolderPath, 'index.md');

        if (existsSync(indexMdPath)) {
          const fileContents = await fs.readFile(indexMdPath, 'utf8');
          const { data } = matter(fileContents);
          const fileSlug = data.slug ? String(data.slug).trim() : bookItem.name;

          if (fileSlug.toLowerCase() === bookSlug.toLowerCase()) {
            return bookFolderPath;
          }
        } else if (bookItem.name.toLowerCase() === bookSlug.toLowerCase()) {
          return bookFolderPath;
        }
      }
    }
    return null;
  } catch (err) {
    console.error(`Error resolving book directory for ${bookSlug}:`, err);
    return null;
  }
}

export async function getBookHierarchy(slug: string): Promise<{
  nodes: BookNode[];
  bookTitle: string;
  coverImage: string;
  volumes: VolumeItem[];
  directChapters: ChapterItem[];
}> {
  const bookDir = await getBookDirectoryBySlug(slug);
  const nodes: BookNode[] = [];
  const volumes: VolumeItem[] = [];
  const directChapters: ChapterItem[] = [];

  let bookTitle = slug;
  let coverImage = '/cover/default-cover.webp';

  if (!bookDir || !existsSync(bookDir)) {
    return { nodes, bookTitle, coverImage, volumes, directChapters };
  }

  const indexMdPath = path.join(bookDir, 'index.md');
  if (existsSync(indexMdPath)) {
    const { data } = matter(readFileSync(indexMdPath, 'utf8'));
    bookTitle = data.title || bookTitle;
    coverImage = data.cover_image || data.cover || coverImage;
  }

  const entries = readdirSync(bookDir, { withFileTypes: true });
  const hasSubVolumes = entries.some((e) => e.isDirectory());

  if (!hasSubVolumes) {
    const chapterFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name.toLowerCase() !== 'index.md')
      .map((e) => e.name)
      .sort(naturalSort);

    for (const chapFile of chapterFiles) {
      const chapFilePath = path.join(bookDir, chapFile);
      const { data } = matter(readFileSync(chapFilePath, 'utf8'));
      const chapSlug = chapFile.replace(/\.md$/, '');
      const title = data.title || chapSlug;
      const items = extractItemsFromData(data);

      directChapters.push({
        slug: chapSlug,
        title,
        item: data.item,
        items,
      });

      nodes.push({
        type: 'chapter',
        href: `/book/${slug}/${chapSlug}`,
        title,
        volId: '',
        chapterSlug: chapSlug,
        filePath: chapFilePath,
      });
    }
  } else {
    const volumeFolders = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort(naturalSort);

    for (const volFolder of volumeFolders) {
      const volPath = path.join(bookDir, volFolder);

      const namedVolFilePath = path.join(volPath, `${volFolder}.md`);
      const indexVolFilePath = path.join(volPath, 'index.md');

      let volIndexPath = '';
      if (existsSync(namedVolFilePath)) {
        volIndexPath = namedVolFilePath;
      } else if (existsSync(indexVolFilePath)) {
        volIndexPath = indexVolFilePath;
      }

      let volTitle = volFolder.toUpperCase();

      if (volIndexPath) {
        const { data } = matter(readFileSync(volIndexPath, 'utf8'));
        volTitle = data.title || data.volume_title || volTitle;

        nodes.push({
          type: 'volume',
          href: `/book/${slug}/${volFolder}`,
          title: volTitle,
          volId: volFolder,
          filePath: volIndexPath,
        });
      }

      const chaptersDir = path.join(volPath, 'chapters');
      const hasChaptersFolder =
        existsSync(chaptersDir) &&
        readdirSync(volPath, { withFileTypes: true }).some((e) => e.isDirectory() && e.name === 'chapters');
      const targetDir = hasChaptersFolder ? chaptersDir : volPath;

      const chapFiles = readdirSync(targetDir, { withFileTypes: true })
        .filter(
          (e) =>
            e.isFile() &&
            e.name.endsWith('.md') &&
            e.name.toLowerCase() !== 'index.md' &&
            e.name !== `${volFolder}.md`
        )
        .map((e) => e.name)
        .sort(naturalSort);

      const volChapters: ChapterItem[] = [];

      for (const chapFile of chapFiles) {
        const chapFilePath = path.join(targetDir, chapFile);
        const { data } = matter(readFileSync(chapFilePath, 'utf8'));
        const chapSlug = chapFile.replace(/\.md$/, '');
        const title = data.title || `পরিচ্ছেদ ${chapSlug}`;
        const items = extractItemsFromData(data);

        volChapters.push({
          slug: chapSlug,
          title,
          item: data.item,
          items,
        });

        nodes.push({
          type: 'chapter',
          href: `/book/${slug}/${volFolder}/${chapSlug}`,
          title,
          volId: volFolder,
          chapterSlug: chapSlug,
          filePath: chapFilePath,
        });
      }

      volumes.push({
        id: volFolder,
        title: volTitle,
        chapters: volChapters,
      });
    }
  }

  return { nodes, bookTitle, coverImage, volumes, directChapters };
}