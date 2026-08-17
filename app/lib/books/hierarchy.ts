import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BookNode, ChapterItem, VolumeItem } from './types';
import { naturalSort } from './utils';
import { extractItemsFromData } from './extractors';
import { getBookDirectoryBySlug } from './fetchers';

// ==========================================
// Book Hierarchy & Structure Scanner
// ==========================================

/**
 * বইয়ের হায়ারার্কি স্ক্যান করার ফাংশন (একক ও বহুখণ্ডের সাপোর্টসহ)
 */
export async function getBookHierarchy(slug: string): Promise<{
  nodes: BookNode[];
  bookTitle: string;
  coverImage: string;
  volumes: VolumeItem[];
  directChapters: ChapterItem[];
  items: any[]; // TableOfContents কম্পোনেন্টের জন্য যুক্ত করা হলো
}> {
  const bookDir = await getBookDirectoryBySlug(slug);
  const nodes: BookNode[] = [];
  const volumes: VolumeItem[] = [];
  const directChapters: ChapterItem[] = [];
  const items: any[] = [];

  let bookTitle = slug;
  let coverImage = '/default-cover.jpg';

  if (!bookDir || !existsSync(bookDir)) {
    return { nodes, bookTitle, coverImage, volumes, directChapters, items };
  }

  // ১. মূল Index.md থেকে বইয়ের শিরোনাম ও কভার ইমেজ সংগ্রহ
  const indexMdPath = path.join(bookDir, 'index.md');
  if (existsSync(indexMdPath)) {
    const { data } = matter(readFileSync(indexMdPath, 'utf8'));
    bookTitle = data.title || bookTitle;
    coverImage = data.cover_image || data.cover || coverImage;
  }

  const entries = readdirSync(bookDir, { withFileTypes: true });

  // ২. রুট লেভেলের সমস্ত চ্যাপ্টার (.md) স্ক্যান করা
  const rootChapterFiles = entries
    .filter(
      (e) =>
        e.isFile() &&
        e.name.endsWith('.md') &&
        e.name.toLowerCase() !== 'index.md'
    )
    .map((e) => e.name)
    .sort(naturalSort);

  for (const chapFile of rootChapterFiles) {
    const chapFilePath = path.join(bookDir, chapFile);
    const { data } = matter(readFileSync(chapFilePath, 'utf8'));
    const chapSlug = chapFile.replace(/\.md$/, '');
    const title = data.title || chapSlug;
    const extractedItems = extractItemsFromData(data);

    const chapterObj = {
      id: chapSlug,
      slug: chapSlug,
      title,
      subtitle: data.subtitle || '',
      type: 'chapter' as const,
      item: data.item,
      items: extractedItems,
      subPages: extractedItems || [],
    };

    directChapters.push(chapterObj as any);
    items.push(chapterObj); // TOC কম্পোনেন্টের জন্য মূল আইটেমসে যুক্ত হচ্ছে

    nodes.push({
      type: 'chapter',
      href: `/book/${slug}/${chapSlug}`,
      title,
      volId: '',
      chapterSlug: chapSlug,
      filePath: chapFilePath,
    });
  }

  // ৩. ফোল্ডার বা ভলিউমসমূহ (Volumes) স্ক্যান করা
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
    let volSubtitle = '';

    if (volIndexPath) {
      const { data } = matter(readFileSync(volIndexPath, 'utf8'));
      volTitle = data.title || data.volume_title || volTitle;
      volSubtitle = data.subtitle || '';

      nodes.push({
        type: 'volume',
        href: `/book/${slug}/${volFolder}`,
        title: volTitle,
        volId: volFolder,
        filePath: volIndexPath,
      });
    }

    // Target directory নির্ণয়
    const chaptersDir = path.join(volPath, 'chapters');
    const hasChaptersFolder =
      existsSync(chaptersDir) &&
      readdirSync(volPath, { withFileTypes: true }).some(
        (e) => e.isDirectory() && e.name === 'chapters'
      );
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
      const extractedItems = extractItemsFromData(data);

      volChapters.push({
        slug: chapSlug,
        title,
        subtitle: data.subtitle || '',
        item: data.item,
        items: extractedItems,
        subPages: extractedItems || [],
      } as any);

      nodes.push({
        type: 'chapter',
        href: `/book/${slug}/${volFolder}/${chapSlug}`,
        title,
        volId: volFolder,
        chapterSlug: chapSlug,
        filePath: chapFilePath,
      });
    }

    const volumeObj = {
      type: 'volume' as const,
      id: volFolder,
      title: volTitle,
      subtitle: volSubtitle,
      chapters: volChapters,
    };

    volumes.push(volumeObj as any);
    items.push(volumeObj); // TOC কম্পোনেন্টের জন্য ভলিউম যুক্ত হচ্ছে
  }

  return { nodes, bookTitle, coverImage, volumes, directChapters, items };
}