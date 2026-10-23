// app/lib/books/hierarchy-core.ts
// Pure part of the book table of contents: turns the .md keys of one book into volumes / chapters / nodes.
// Shared by hierarchy.ts (slow path, reads R2) and lib/catalog/build.ts (builds the toc manifest at sync time).
import matter from 'gray-matter';
import type { BookNode, VolumeItem, ChapterItem } from './types';
import { naturalSort, extractItemsFromData } from './utils';

export interface BookHierarchy {
  nodes: BookNode[];
  bookTitle: string;
  coverImage: string;
  volumes: VolumeItem[];
  directChapters: ChapterItem[];
}

/** Key of the prebuilt table of contents of a book, e.g. "books/a/b/" -> "_manifest/toc/a/b.json". */
export function tocManifestKey(bookPrefix: string): string {
  return `_manifest/toc/${bookPrefix.replace(/^books\//, '').replace(/\/$/, '')}.json`;
}

/**
 * @param allKeys every key under bookPrefix
 * @param readRaw reads the text of one key (null if missing)
 */
export async function computeBookHierarchy(
  bookPrefix: string, // e.g. "books/bankim/durgeshnandini/"
  bookSlug: string, // slug used in the URLs (needed for hrefs)
  allKeys: string[],
  readRaw: (key: string) => Promise<string | null>
): Promise<BookHierarchy> {
  const nodes: BookNode[] = [];
  const volumes: VolumeItem[] = [];
  const directChapters: ChapterItem[] = [];

  let bookTitle = bookSlug;
  let coverImage = '/cover/default-cover.webp';

  if (allKeys.length === 0) {
    return { nodes, bookTitle, coverImage, volumes, directChapters };
  }

  const indexMdKey = `${bookPrefix}index.md`;
  if (allKeys.includes(indexMdKey)) {
    const raw = await readRaw(indexMdKey);
    if (raw) {
      const { data } = matter(raw);
      bookTitle = data.title || bookTitle;
      coverImage = data.cover_image || data.cover || coverImage;
    }
  }

  // key relative to the book folder, e.g. "chapter1.md" or "vol1/index.md" or "vol1/chapters/ch1.md"
  const relativeKeys = allKeys
    .filter((k) => k !== indexMdKey)
    .map((k) => k.slice(bookPrefix.length));

  // a '/' in a relative key means there are volume subfolders (R2 has no real folders)
  const hasSubVolumes = relativeKeys.some((k) => k.includes('/'));

  if (!hasSubVolumes) {
    const chapterKeys = relativeKeys.filter((k) => k.endsWith('.md')).sort(naturalSort);

    for (const chapRel of chapterKeys) {
      const chapKey = `${bookPrefix}${chapRel}`;
      const raw = await readRaw(chapKey);
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
    // unique volume folder names from the first segment of the relative keys
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
        const raw = await readRaw(volIndexKey);
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

      // chapters/ subfolder present?
      const chaptersPrefix = `${volPrefix}chapters/`;
      const hasChaptersFolder = allKeys.some((k) => k.startsWith(chaptersPrefix));
      const targetPrefix = hasChaptersFolder ? chaptersPrefix : volPrefix;

      const chapKeys = allKeys
        .filter((k) => {
          if (!k.startsWith(targetPrefix)) return false;
          const rel = k.slice(targetPrefix.length);
          if (rel.includes('/')) return false; // no deeper subfolders
          if (!rel.endsWith('.md')) return false;
          if (rel.toLowerCase() === 'index.md') return false;
          if (rel === `${volFolder}.md`) return false;
          return true;
        })
        .sort(naturalSort);

      const volChapters: ChapterItem[] = [];

      for (const chapKey of chapKeys) {
        const raw = await readRaw(chapKey);
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
