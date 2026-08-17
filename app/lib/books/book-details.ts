import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getSlug } from '@/app/lib/content/core/registry';
import { BookDetail, SubPageItem } from './types'; // SubPageItem বা প্রয়োজনীয় টাইপ ইম্পোর্ট নিশ্চিত করুন
import { booksDirectory, parseSubdomains, slugify } from './utils';
import {
  collectChapterItemsDeep,
  extractGenresFromData,
  extractItemsFromData,
  extractSeriesFromData,
  generateGenreLinks,
} from './extractors';
import { getBookHierarchy } from './hierarchy';

/**
 * ৪. নির্দিষ্ট বই, খণ্ড বা অধ্যায় ফেচ করার মূল ফাংশন
 */
export async function getBookBySlug(
  bookSlug: string,
  currentSubdomain?: string,
  volumeOrChapterSlug?: string,
  chapterSlug?: string
): Promise<BookDetail | null> {
  if (!existsSync(booksDirectory)) return null;

  try {
    const authorItems = await fs.readdir(booksDirectory, { withFileTypes: true });

    for (const authorItem of authorItems) {
      if (!authorItem.isDirectory()) continue;

      const authorFolderName = authorItem.name;
      const authorFolderPath = path.join(booksDirectory, authorFolderName);
      const bookItems = await fs.readdir(authorFolderPath, { withFileTypes: true });

      for (const bookItem of bookItems) {
        if (!bookItem.isDirectory()) continue;

        const bookFolderName = bookItem.name;
        const bookFolderPath = path.join(authorFolderPath, bookFolderName);
        const indexMdPath = path.join(bookFolderPath, 'index.md');

        if (!existsSync(indexMdPath)) continue;

        try {
          const mainIndexContents = await fs.readFile(indexMdPath, 'utf8');
          const { data: mainData } = matter(mainIndexContents);

          const registrySlug = getSlug('books', mainData.title);
          const fileSlug = registrySlug || (mainData.slug ? String(mainData.slug).trim() : slugify(mainData.title) || bookFolderName);

          // ডিকোড করা ইউআরএল ও বাংলা স্লাগ উভয় ক্ষেত্রে মিলানোর লজিক
          const isMatchedSlug = 
            fileSlug.toLowerCase() === bookSlug.toLowerCase() ||
            encodeURIComponent(fileSlug).toLowerCase() === bookSlug.toLowerCase() ||
            fileSlug.toLowerCase() === decodeURIComponent(bookSlug).toLowerCase() ||
            bookFolderName.toLowerCase() === bookSlug.toLowerCase();

          if (!isMatchedSlug) {
            continue;
          }

          const bookSubdomains = parseSubdomains(mainData.subdomain, authorFolderName);

          const { nodes, volumes, directChapters } = await getBookHierarchy(fileSlug);

          // জঁরা ও সিরিজ কেবল বইয়ের মূল index.md থেকেই গৃহিত
          const extractedGenres = extractGenresFromData(mainData);
          if (extractedGenres.length === 0) extractedGenres.push('অন্যান্য');

          let targetFilePath = indexMdPath;
          let currentVolTitle = '';
          let currentChapTitle = '';
          let targetNodeIndex = -1;

          if (volumeOrChapterSlug) {
            if (chapterSlug) {
              const matchedNodeIndex = nodes.findIndex(
                (n) =>
                  n.type === 'chapter' &&
                  n.volId.toLowerCase() === volumeOrChapterSlug.toLowerCase() &&
                  n.chapterSlug?.toLowerCase() === chapterSlug.toLowerCase()
              );
              if (matchedNodeIndex !== -1) {
                targetNodeIndex = matchedNodeIndex;
                targetFilePath = nodes[matchedNodeIndex].filePath;
                currentChapTitle = nodes[matchedNodeIndex].title;
                const parentVol = nodes.find(
                  (n) => n.type === 'volume' && n.volId === nodes[matchedNodeIndex].volId
                );
                if (parentVol) currentVolTitle = parentVol.title;
              }
            } else {
              const matchedNodeIndex = nodes.findIndex(
                (n) =>
                  (n.type === 'volume' && n.volId.toLowerCase() === volumeOrChapterSlug.toLowerCase()) ||
                  (n.type === 'chapter' && n.chapterSlug?.toLowerCase() === volumeOrChapterSlug.toLowerCase())
              );

              if (matchedNodeIndex !== -1) {
                targetNodeIndex = matchedNodeIndex;
                targetFilePath = nodes[matchedNodeIndex].filePath;
                if (nodes[matchedNodeIndex].type === 'volume') {
                  currentVolTitle = nodes[matchedNodeIndex].title;
                } else {
                  currentChapTitle = nodes[matchedNodeIndex].title;
                }
              }
            }
          }

          if (!existsSync(targetFilePath)) {
            targetFilePath = indexMdPath;
          }

          const fileContents = await fs.readFile(targetFilePath, 'utf8');
          const { data: pageData, content } = matter(fileContents);

          // [সংশোধন ১]: pageItems-এর টাইপ সেফটি এবং ক্লিন আপ
          // extractItemsFromData এবং collectChapterItemsDeep উভয় রিটার্ন মিলিয়ে টাইপ সেট করা
          let pageItems: any[] = [];
          
          if (targetFilePath === indexMdPath) {
            pageItems = collectChapterItemsDeep(bookFolderPath);
          } else {
            pageItems = extractItemsFromData(pageData);
          }

          // নেভিগেশন লিঙ্ক নির্ধারণ লজিক
          let prevLink = '/books';
          let prevLabel = 'গ্রন্থাগার';
          let nextLink = '/books';
          let nextLabel = 'গ্রন্থাগার';

          if (targetNodeIndex === -1) {
            if (nodes.length > 0) {
              nextLink = nodes[0].href;
              nextLabel = nodes[0].title;
            }
          } else {
            if (targetNodeIndex > 0) {
              prevLink = nodes[targetNodeIndex - 1].href;
              prevLabel = nodes[targetNodeIndex - 1].title;
            } else {
              prevLink = `/book/${fileSlug}`;
              prevLabel = mainData.title || 'সূচিপত্র';
            }

            if (targetNodeIndex < nodes.length - 1) {
              nextLink = nodes[targetNodeIndex + 1].href;
              nextLabel = nodes[targetNodeIndex + 1].title;
            } else {
              nextLink = '/books';
              nextLabel = 'গ্রন্থাগার';
            }
          }

          const resolvedSubtitle = pageData.subtitle
            ? String(pageData.subtitle)
            : targetNodeIndex === -1 && mainData.subtitle
            ? String(mainData.subtitle)
            : '';

          const resolvedNotice = pageData.notice
            ? String(pageData.notice)
            : targetNodeIndex === -1 && mainData.notice
            ? String(mainData.notice)
            : '';

          // সিরিজ রেজোলিউশন (একমাত্র mainData থেকে)
          const extractedSeriesList = extractSeriesFromData(mainData);
          const seriesNames = extractedSeriesList.map((s) => s.name);
          const primarySeries = extractedSeriesList[0];

          // জঁরা লিঙ্ক রেজোলিউশন (একমাত্র mainData থেকে)
          const resolvedGenreLinks = generateGenreLinks(mainData.genre_links, extractedGenres);

          return {
            id: fileSlug,
            slug: fileSlug,
            title: mainData.title || 'শিরোনামহীন বই',
            subtitle: resolvedSubtitle,
            meta_title: pageData.meta_title || mainData.meta_title || '',
            meta_description: pageData.meta_description || mainData.meta_description || '',
            author: mainData.author || 'অজ্ঞাত লেখক',
            authorSlug: mainData.authorSlug || authorFolderName,
            translator: mainData.translator || '',
            translatorSlug: mainData.translatorSlug || '',
            editor: mainData.editor || '',
            editorSlug: mainData.editorSlug || '',
            subdomains: bookSubdomains,
            genres: extractedGenres,
            genre: mainData.genre || extractedGenres,
            genre_links: resolvedGenreLinks,
            items: pageItems,
            item: pageData.item || pageItems,
            series: seriesNames.length > 1 ? seriesNames : primarySeries?.name || '',
            seriesList: extractedSeriesList,
            seriesSlug: primarySeries?.slug || '',
            series_link: primarySeries?.link || '',
            series_order: primarySeries?.order ?? mainData.series_order ?? '',
            series_title: primarySeries?.title || mainData.series_title || '',
            // [সংশোধন ২]: series_info টাইপ সেফ করা হলো
            series_info: extractedSeriesList.length > 0 ? extractedSeriesList : primarySeries || null,
            volumes: volumes.length > 0 ? volumes : mainData.volumes || [],
            directChapters: directChapters.length > 0 ? directChapters : mainData.directChapters || [],
            metaFiles: mainData.metaFiles || [],
            publishDate: mainData.published
              ? String(mainData.published)
              : mainData.date
              ? String(mainData.date)
              : '',
            published: mainData.published ? String(mainData.published) : '',
            first_published: mainData.first_published || '',
            publisher: mainData.publisher ? String(mainData.publisher) : '',
            cover: mainData.cover || mainData.cover_image || '',
            cover_image: mainData.cover_image || mainData.cover || '',
            source_book: mainData.source_book || '',
            pub_medium: mainData.pub_medium ? String(mainData.pub_medium) : '',
            notice: resolvedNotice,
            og_image: pageData.og_image || mainData.og_image || '',
            footnotes: pageData.footnotes || mainData.footnotes || [],
            chapter_title: pageData.chapter_title || currentChapTitle || '',
            volume_title: pageData.volume_title || currentVolTitle || '',
            currentChapterTitle: currentChapTitle || pageData.currentChapterTitle || '',
            currentVolumeTitle: currentVolTitle || pageData.currentVolumeTitle || '',
            prevLink,
            prevLabel,
            nextLink,
            nextLabel,
            content,
            rawFrontmatter: pageData,
          };
        } catch {
          continue;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching book with slug ${bookSlug}:`, error);
    return null;
  }
}