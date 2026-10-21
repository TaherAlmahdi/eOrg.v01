// app/lib/books/hierarchy.ts
import matter from 'gray-matter';
import { BookNode, VolumeItem, ChapterItem } from './types';
import { naturalSort, extractItemsFromData } from './utils';
import { getAssetsBucket, readTextFromR2 } from './r2';

/**
 * একটা prefix-এর নিচে থাকা সব R2 key রিকার্সিভভাবে লিস্ট করে
 * (fs.readdirSync-এর বদলে ব্যবহার হবে — R2-তে আসল ফোল্ডার নেই, সব ফ্ল্যাট key)
 */
async function listKeysUnderPrefix(prefix: string): Promise<string[]> {
  const bucket = await getAssetsBucket();
  const keys: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const result: R2Objects = await bucket.list({ prefix, cursor });
    for (const obj of result.objects) {
      keys.push(obj.key);
    }
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return keys;
}

export async function getBookHierarchy(
  bookPrefix: string, // যেমন: "books/bankim/durgeshnandini/"
  bookSlug: string // URL-এ ব্যবহৃত বইয়ের slug (href বানাতে লাগে)
): Promise<{
  nodes: BookNode[];
  bookTitle: string;
  coverImage: string;
  volumes: VolumeItem[];
  directChapters: ChapterItem[];
}> {
  const nodes: BookNode[] = [];
  const volumes: VolumeItem[] = [];
  const directChapters: ChapterItem[] = [];

  let bookTitle = bookSlug;
  let coverImage = '/cover/default-cover.webp';

  const allKeys = await listKeysUnderPrefix(bookPrefix);
  if (allKeys.length === 0) {
    return { nodes, bookTitle, coverImage, volumes, directChapters };
  }

  const indexMdKey = `${bookPrefix}index.md`;
  if (allKeys.includes(indexMdKey)) {
    const raw = await readTextFromR2(indexMdKey);
    if (raw) {
      const { data } = matter(raw);
      bookTitle = data.title || bookTitle;
      coverImage = data.cover_image || data.cover || coverImage;
    }
  }

  // bookPrefix বাদ দিয়ে প্রতিটা key-এর রিলেটিভ অংশ বের করা
  // যেমন: "chapter1.md" বা "vol1/index.md" বা "vol1/chapters/ch1.md"
  const relativeKeys = allKeys
    .filter((k) => k !== indexMdKey)
    .map((k) => k.slice(bookPrefix.length));

  // '/' থাকলেই বোঝা যাবে ভলিউম-সাবফোল্ডার আছে (আগে fs-এ directory চেক হতো, এখানে key প্যাটার্ন দিয়ে)
  const hasSubVolumes = relativeKeys.some((k) => k.includes('/'));

  if (!hasSubVolumes) {
    const chapterKeys = relativeKeys.filter((k) => k.endsWith('.md')).sort(naturalSort);

    for (const chapRel of chapterKeys) {
      const chapKey = `${bookPrefix}${chapRel}`;
      const raw = await readTextFromR2(chapKey);
      if (!raw) continue;

      const { data } = matter(raw);
      const chapSlug = chapRel.replace(/\.md$/, '');
      const title = data.title || chapSlug;
      const items = extractItemsFromData(data);

      directChapters.push({ slug: chapSlug, title, item: data.item, items });

      nodes.push({
        type: 'chapter',
        href: `/book/${bookSlug}/${chapSlug}`,
        title,
        volId: '',
        chapterSlug: chapSlug,
        filePath: chapKey,
      });
    }
  } else {
    // রিলেটিভ key-গুলোর প্রথম সেগমেন্ট থেকে ইউনিক ভলিউম-ফোল্ডারের নাম বের করা
    const volFolderSet = new Set<string>();
    for (const rel of relativeKeys) {
      volFolderSet.add(rel.split('/')[0]);
    }
    const volumeFolders = Array.from(volFolderSet).sort(naturalSort);

    for (const volFolder of volumeFolders) {
      const volPrefix = `${bookPrefix}${volFolder}/`;
      const namedVolKey = `${volPrefix}${volFolder}.md`;
      const indexVolKey = `${volPrefix}index.md`;

      let volIndexKey = '';
      if (allKeys.includes(namedVolKey)) {
        volIndexKey = namedVolKey;
      } else if (allKeys.includes(indexVolKey)) {
        volIndexKey = indexVolKey;
      }

      let volTitle = volFolder.toUpperCase();

      if (volIndexKey) {
        const raw = await readTextFromR2(volIndexKey);
        if (raw) {
          const { data } = matter(raw);
          volTitle = data.title || data.volume_title || volTitle;
        }

        nodes.push({
          type: 'volume',
          href: `/book/${bookSlug}/${volFolder}`,
          title: volTitle,
          volId: volFolder,
          filePath: volIndexKey,
        });
      }

      // chapters/ সাবফোল্ডার আছে কিনা — key প্যাটার্ন দিয়ে চেক
      const chaptersPrefix = `${volPrefix}chapters/`;
      const hasChaptersFolder = allKeys.some((k) => k.startsWith(chaptersPrefix));
      const targetPrefix = hasChaptersFolder ? chaptersPrefix : volPrefix;

      const chapKeys = allKeys
        .filter((k) => {
          if (!k.startsWith(targetPrefix)) return false;
          const rel = k.slice(targetPrefix.length);
          if (rel.includes('/')) return false; // আরও গভীরে সাবফোল্ডার না
          if (!rel.endsWith('.md')) return false;
          if (rel.toLowerCase() === 'index.md') return false;
          if (rel === `${volFolder}.md`) return false;
          return true;
        })
        .sort(naturalSort);

      const volChapters: ChapterItem[] = [];

      for (const chapKey of chapKeys) {
        const raw = await readTextFromR2(chapKey);
        if (!raw) continue;

        const { data } = matter(raw);
        const chapFileName = chapKey.split('/').pop()!;
        const chapSlug = chapFileName.replace(/\.md$/, '');
        const title = data.title || `পরিচ্ছেদ ${chapSlug}`;
        const items = extractItemsFromData(data);

        volChapters.push({ slug: chapSlug, title, item: data.item, items });

        nodes.push({
          type: 'chapter',
          href: `/book/${bookSlug}/${volFolder}/${chapSlug}`,
          title,
          volId: volFolder,
          chapterSlug: chapSlug,
          filePath: chapKey,
        });
      }

      volumes.push({ id: volFolder, title: volTitle, chapters: volChapters });
    }
  }

  return { nodes, bookTitle, coverImage, volumes, directChapters };
}