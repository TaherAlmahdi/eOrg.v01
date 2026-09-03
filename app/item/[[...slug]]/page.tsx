import { cache } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import Notice from '@/app/components/Notice';
import TOCItem from '@/app/components/TOCItem';
import ItemDetails from '@/app/components/ItemDetails';

import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { getBookBySlug, getItemsByItemType } from '@/app/lib/books/singleItemExtract';
import { parseNoteShortcodes } from '@/app/lib/parse-shortcodes';
import { getItemSlug, getItemMeta } from '@/app/lib/content/core/registry/items';

// ==========================================
// 📐 Interfaces
// ==========================================

interface PageParams {
  slug?: string | string[];
  itemSlug?: string | string[];
  titleSlug?: string;
}

interface PageProps {
  params: Promise<PageParams>;
  searchParams?: Promise<{
    page?: string;
  }>;
}

interface NoteItem {
  id: string | number;
  label: string;
  text: unknown;
}

interface SplitPage {
  title?: string;
  pageNumber: number;
  contentHtml: string;
  notes: NoteItem[];
}

export interface ItemDetail {
  slug?: string;
  title: string;
  subtitle?: string;
  author?: string | string[];
  translator?: string | string[];
  editor?: string | string[];
  content?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  cover_image?: string;
  item?: string | any;
  type?: string | any;
  rawFrontmatter?: { notice?: string; slug?: string; title?: string };
  [key: string]: unknown;
}

// ==========================================
// 🛠️ Helper Functions
// ==========================================

const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

function slugifyTitle(title: string): string {
  if (!title) return '';
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF\-]/g, '');
}

function resolveItemSlug(item: ItemDetail | null, fallbackSlug: string): string {
  if (!item) return slugifyTitle(fallbackSlug);
  if (item.slug?.trim()) return item.slug.trim();
  if (item.rawFrontmatter?.slug?.trim()) return item.rawFrontmatter.slug.trim();
  if (item.title?.trim()) return slugifyTitle(item.title);
  if (item.rawFrontmatter?.title?.trim()) return slugifyTitle(item.rawFrontmatter.title);
  return slugifyTitle(fallbackSlug);
}

function extractTargetSlug(params: PageParams): string[] {
  if (params.slug) {
    return Array.isArray(params.slug) ? params.slug : [params.slug];
  }
  if (params.itemSlug) {
    const itemSegments = Array.isArray(params.itemSlug) ? params.itemSlug : [params.itemSlug];
    return params.titleSlug ? [...itemSegments, params.titleSlug] : itemSegments;
  }
  return params.titleSlug ? [params.titleSlug] : [];
}

function resolveRouteSegments(rawSegments: string[]) {
  let cleanSegments = [...rawSegments];
  let pageNumFromPath: number | null = null;
  const lastSegment = rawSegments[rawSegments.length - 1];

  if (/^\d+$/.test(lastSegment) && rawSegments.length > 1) {
    pageNumFromPath = parseInt(lastSegment, 10);
    cleanSegments = rawSegments.slice(0, -1);
  }

  return {
    fullItemSlug: cleanSegments.join('/'),
    pageNumFromPath,
    cleanSegments,
  };
}

const fetchItemData = async (itemSlug: string) => (itemSlug ? await getBookBySlug(itemSlug) : null);
const getItemData = cache(fetchItemData);

const getAllSortedItems = cache(async () => {
  const items = await getItemsByItemType();
  return (items || []).sort((a: ItemDetail, b: ItemDetail) =>
    (a.title || '').localeCompare(b.title || '', 'bn')
  );
});

const getItemTypeName = (itemObj: any): string => {
  const rawItem = itemObj?.item || itemObj?.type;
  if (!rawItem) return '';
  return getItemSlug(rawItem);
};

const getItemTypeDisplayName = (itemObj: any): string => {
  const rawItem = itemObj?.item || itemObj?.type;
  if (!rawItem) return '';
  const meta = getItemMeta(rawItem);
  return meta?.name || getItemSlug(rawItem);
};

function parseItemSubPages(fullContent: string): SplitPage[] {
  if (!fullContent) return [];

  const pageSegments = fullContent.split(/<!--\s*nextpage(?:\s+([\s\S]*?))?\s*-->/gi);
  const splitPages: SplitPage[] = [];

  const firstChunk = pageSegments[0] || '';
  const parsedFirst = parseNoteShortcodes(firstChunk);
  splitPages.push({
    title: undefined,
    pageNumber: 1,
    contentHtml: parsedFirst.contentHtml,
    notes: parsedFirst.notes,
  });

  for (let i = 1, pageCounter = 2; i < pageSegments.length; i += 2, pageCounter++) {
    const pageTitle = pageSegments[i] ? pageSegments[i].trim() : undefined;
    const pageBody = pageSegments[i + 1] || '';
    const parsed = parseNoteShortcodes(pageBody);

    splitPages.push({
      title: pageTitle,
      pageNumber: pageCounter,
      contentHtml: parsed.contentHtml,
      notes: parsed.notes,
    });
  }

  return splitPages;
}

function resolveActivePageIndex(
  splitPages: SplitPage[],
  pageNumFromPath: number | null,
  queryPage?: string
): number {
  if (pageNumFromPath && pageNumFromPath > 0 && pageNumFromPath <= splitPages.length) {
    return pageNumFromPath - 1;
  }
  if (queryPage) {
    const queryNum = parseInt(queryPage, 10);
    if (!isNaN(queryNum) && queryNum > 0 && queryNum <= splitPages.length) {
      return queryNum - 1;
    }
  }
  return 0;
}

function getPageDisplayTitle(pageTitle: string, currentSubPageTitle?: string, currentPageNum?: number): string {
  const titleParts: string[] = [pageTitle];
  if (currentSubPageTitle) {
    titleParts.push(currentSubPageTitle);
  } else if (currentPageNum && currentPageNum > 1) {
    titleParts.push(`পাতা ${toBengaliNumber(currentPageNum)}`);
  }
  return titleParts.join(' ❀ ');
}

// ==========================================
// 🏷️ Dynamic Metadata Export
// ==========================================

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawSegments = extractTargetSlug(resolvedParams);

  const headersList = await headers();
  const siteData = getSubdomainData(headersList.get('host') || '');
  const siteName = siteData?.title || 'এডুলিচার';

  if (rawSegments.length === 0) {
    return { title: `প্রকরণ পাওয়া যায়নি ❀ ${siteName}` };
  }

  const { fullItemSlug, pageNumFromPath } = resolveRouteSegments(rawSegments);
  const item = await getItemData(fullItemSlug);

  if (!item) {
    return { title: `প্রকরণ পাওয়া যায়নি ❀ ${siteName}` };
  }

  const effectiveSlug = resolveItemSlug(item, fullItemSlug);
  const splitPages = parseItemSubPages(item.content || '');
  const activePageIndex = resolveActivePageIndex(splitPages, pageNumFromPath, resolvedSearchParams.page);
  const currentSubPage = splitPages[activePageIndex];
  const currentPageNum = activePageIndex + 1;

  const pageTitle = item.rawFrontmatter?.title || item.title;
  const subPageSubtitle = currentSubPage?.title;

  const pageDisplayTitle = getPageDisplayTitle(pageTitle, subPageSubtitle, currentPageNum);
  
  const dynamicMetaTitle = buildTabTitle({
    metaTitle: item.meta_title,
    currentPageTitle: pageDisplayTitle || undefined,
    bookTitle: item.title,
    siteName: siteName,
  });

  const authorStr = Array.isArray(item.author) ? item.author.join(', ') : item.author;
  const description =
    item.meta_description ||
    `${pageTitle}${subPageSubtitle ? ` - ${subPageSubtitle}` : ''}${authorStr ? ` | ${authorStr}` : ''} | এডুলিচার পাঠশালা।`;

  const domainUrl = siteData?.subdomain
    ? `https://${siteData.subdomain}.eduliture.org`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://eduliture.org';

  const canonicalUrl = `${domainUrl}/item/${effectiveSlug}${currentPageNum > 1 ? `/${currentPageNum}` : ''}`;
  const fallbackOgUrl = `/api/og?title=${encodeURIComponent(pageTitle)}&subtitle=${encodeURIComponent(
    subPageSubtitle || item.subtitle || siteName
  )}&tagline=${encodeURIComponent('এডুলিচার পাঠশালা')}`;
  const shareImage = item.og_image || item.cover_image || siteData?.ogImage || fallbackOgUrl;

  return {
    title: dynamicMetaTitle,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: dynamicMetaTitle,
      description,
      url: canonicalUrl,
      siteName,
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: pageTitle }] : [],
      locale: 'bn_BD',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicMetaTitle,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

// ==========================================
// 📖 Main Page Component
// ==========================================

export default async function SingleItemPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawSegments = extractTargetSlug(resolvedParams);

  if (rawSegments.length === 0) notFound();

  const headersList = await headers();
  const siteData = getSubdomainData(headersList.get('host') || '');
  const siteTitle = siteData?.title || 'এডুলিচার';

  const { fullItemSlug, pageNumFromPath } = resolveRouteSegments(rawSegments);
  const item = await getItemData(fullItemSlug);

  if (!item) notFound();

  const effectiveSlug = resolveItemSlug(item, fullItemSlug);
  const splitPages = parseItemSubPages(item.content || '');
  const activePageIndex = resolveActivePageIndex(splitPages, pageNumFromPath, resolvedSearchParams.page);

  const currentSubPageData = splitPages[activePageIndex] || splitPages[0];
  const currentPageNum = activePageIndex + 1;
  const totalSubPages = splitPages.length;

  const pageTitle = item.rawFrontmatter?.title || item.title;
  const nextpageSubtitle = currentSubPageData?.title;

  const fileSubtitle = item.subtitle?.trim();
  const activeSubtitle = currentPageNum === 1 ? fileSubtitle : nextpageSubtitle;

  const getSubPageLabel = (pageData?: SplitPage) => {
    if (!pageData) return '';
    if (pageData.pageNumber === 1) return fileSubtitle || pageTitle;
    if (pageData.title) return pageData.title;
    return `পাতা ${toBengaliNumber(pageData.pageNumber)}`;
  };

  const currentType = getItemTypeName(item);
  const itemTypeDisplayName = getItemTypeDisplayName(item);
  const allItems = await getAllSortedItems();
  
  const filteredList = allItems.filter((i) => getItemTypeName(i) === currentType);
  const currentIndex = filteredList.findIndex(
    (i) => resolveItemSlug(i, i.title) === effectiveSlug
  );

  let prevActionLink: string | null = null;
  let prevActionLabel: string | null = null;
  let nextActionLink: string | null = null;
  let nextActionLabel: string | null = null;

  if (currentPageNum > 1) {
    const prevPageNum = currentPageNum - 1;
    const prevPageObj = splitPages[prevPageNum - 1];
    prevActionLink = prevPageNum === 1 ? `/item/${effectiveSlug}` : `/item/${effectiveSlug}/${prevPageNum}`;
    prevActionLabel = getSubPageLabel(prevPageObj);
  } else if (currentIndex > 0) {
    const prevItem = filteredList[currentIndex - 1];
    prevActionLink = `/item/${resolveItemSlug(prevItem, prevItem.title)}`;
    prevActionLabel = prevItem.title;
  } else {
    prevActionLink = `/items/${currentType}`;
    prevActionLabel = itemTypeDisplayName;
  }

  if (currentPageNum < totalSubPages) {
    const nextPageNum = currentPageNum + 1;
    const nextPageObj = splitPages[nextPageNum - 1];
    nextActionLink = `/item/${effectiveSlug}/${nextPageNum}`;
    nextActionLabel = getSubPageLabel(nextPageObj);
  } else if (currentIndex !== -1 && currentIndex < filteredList.length - 1) {
    const nextItem = filteredList[currentIndex + 1];
    nextActionLink = `/item/${resolveItemSlug(nextItem, nextItem.title)}`;
    nextActionLabel = nextItem.title;
  } else {
    nextActionLink = `/items/${currentType}`;
    nextActionLabel = itemTypeDisplayName;
  }

  const rawNotice = item.rawFrontmatter?.notice;
  const pageNotice = typeof rawNotice === 'string' && rawNotice.trim() ? rawNotice.trim() : null;

  const domainUrl = siteData?.subdomain
    ? `https://${siteData.subdomain}.eduliture.org`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://eduliture.org';

  const currentFullUrl = `${domainUrl}/item/${effectiveSlug}${currentPageNum > 1 ? `/${currentPageNum}` : ''}`;
  const fallbackOgUrl = `/api/og?title=${encodeURIComponent(pageTitle)}&subtitle=${encodeURIComponent(
    activeSubtitle || siteTitle
  )}&tagline=${encodeURIComponent('এডুলিচার অনলাইন সাহিত্য সংকলন')}`;

  const authorName = Array.isArray(item.author) ? item.author.join(', ') : item.author || 'অজানা লেখক';
  const translatorName = Array.isArray(item.translator) ? item.translator.join(', ') : item.translator;
  const editorName = Array.isArray(item.editor) ? item.editor.join(', ') : item.editor;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pageTitle,
    author: { '@type': 'Person', name: authorName },
    ...(translatorName && { translator: { '@type': 'Person', name: translatorName } }),
    ...(editorName && { editor: { '@type': 'Person', name: editorName } }),
    url: currentFullUrl,
    image: item.og_image || item.cover_image || siteData?.ogImage || fallbackOgUrl,
    description: item.meta_description || `${pageTitle}${activeSubtitle ? ` - ${activeSubtitle}` : ''} | এডুলিচার সাহিত্য সংকলন।`,
    inLanguage: 'bn',
    publisher: { '@type': 'Organization', name: siteTitle, url: domainUrl },
    mainEntityOfPage: { '@type': 'WebPage', '@id': currentFullUrl },
  };

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />

      {/* Breadcrumb Navigation */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="flex items-center max-w-full mx-auto text-sm font-tarunima whitespace-nowrap">
          <Link href="/" className="transition-colors shrink-0 hover:text-red-100" title="হোম">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/items" className="transition-colors hover:text-red-100 shrink-0">
            প্রকরণ
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href={`/items/${currentType}`} className="transition-colors hover:text-red-100 shrink-0">
            {itemTypeDisplayName}
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          
          {(nextpageSubtitle || currentPageNum > 1) ? (
            <>
              <Link href={`/item/${effectiveSlug}`} className="transition-colors hover:text-red-100 shrink-0">
                {pageTitle}
              </Link>
              {nextpageSubtitle && (
                <>
                  <span className="mx-2 text-white/50 shrink-0">/</span>
                  <span className="font-medium text-white whitespace-nowrap">{nextpageSubtitle}</span>
                </>
              )}
              {!nextpageSubtitle && currentPageNum > 1 && (
                <>
                  <span className="mx-2 text-white/50 shrink-0">/</span>
                  <span className="font-medium text-white shrink-0">পাতা {toBengaliNumber(currentPageNum)}</span>
                </>
              )}
            </>
          ) : (
            <span className="font-medium text-white shrink-0">{pageTitle}</span>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <div className="grid max-w-full grid-cols-1 gap-0 mx-auto lg:grid-cols-12">
        {/* Content Section */}
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] shadow-sm min-h-screen flex flex-col justify-between">
          <div>
            <header className="mb-0 text-center font-tarunima bg-[#f0f0f5] p-3 md:p-6">
              <h1 className="mb-2 text-lg font-semibold text-green-900 md:text-2xl font-tarunima">
                {pageTitle}
              </h1>

              {activeSubtitle && (
                <p className="mb-1 text-lg tracking-wide text-red-900 uppercase md:text-xl opacity-90">
                  {activeSubtitle}
                </p>
              )}

              <div className="space-y-0.5 text-red-900 font-tarunima">
                {item.author && <p className="text-lg font-medium">{authorName}</p>}
                {translatorName && (
                  <p className="text-base opacity-90">
                    অনুবাদ: <span className="font-medium">{translatorName}</span>
                  </p>
                )}
                {editorName && (
                  <p className="text-base opacity-90">
                    সম্পাদনা: <span className="font-medium">{editorName}</span>
                  </p>
                )}
              </div>

              <div className="w-48 h-0.5 bg-red-900/40 mx-auto mt-3"></div>
            </header>

            <article className="leading-relaxed prose text-gray-900 lg:xl max-w-none p-3 md:px-6 md:py-3 font-tarunima">
              {pageNotice && <Notice message={pageNotice} />}

              {currentSubPageData?.contentHtml && (
                <div
                  className="space-y-4 markdown-body"
                  dangerouslySetInnerHTML={{ __html: currentSubPageData.contentHtml }}
                />
              )}

              {/* Notes Section */}
              {currentSubPageData?.notes && currentSubPageData.notes.length > 0 && (
                <div className="pt-6 mt-10 border-t-2 border-orange-200/80">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-red-900"></span>
                    <h4 className="text-lg md:text-xl font-bold text-red-900 font-tarunima">টিকা ও মন্তব্য</h4>
                  </div>

                  <ol className="flex flex-wrap ml-0 text-sm text-gray-700 list-outside not-prose gap-x-2 gap-y-1 md:text-base">
                    {currentSubPageData.notes.map((note) => {
                      const noteHtmlContent = typeof note.text === 'string' ? note.text : JSON.stringify(note.text);

                      return (
                        <li
                          key={note.id}
                          id={`fn-${note.id}`}
                          className="flex-auto min-w-[250px] p-2 bg-white/70 hover:bg-white not-prose rounded border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition-all duration-200 text-sm md:text-base text-gray-800 flex items-start gap-1.5 font-tarunima"
                        >
                          <span className="shrink-0 px-1.5 py-0.5 text-sm font-semibold text-blue-900 bg-blue-50 border border-blue-200/60 rounded transition-colors">
                            {note.label}.
                          </span>

                          <a
                            href={`#fnref-${note.id}`}
                            className="shrink-0 w-3 h-5 flex items-center justify-center text-blue-600 hover:text-red-700 hover:bg-red-50 rounded transition-all text-base font-bold"
                            title="উপরে পাঠ্যের টিকায় ফিরে যান"
                          >
                            ↑
                          </a>

                          <div
                            className="flex-1 leading-relaxed text-justify markdown-body [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-red-700"
                            dangerouslySetInnerHTML={{ __html: noteHtmlContent }}
                          />
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </article>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between p-3 md:p-6 mt-8 border-t border-orange-200 font-tarunima">
            {prevActionLink ? (
              <Link
                href={prevActionLink}
                className="bg-red-900 text-white px-4 py-2 rounded font-normal hover:bg-red-800 transition-all flex items-center group shadow-md text-sm md:text-base max-w-[48.5%]"
              >
                <span className="mr-2 transition-transform transform group-hover:-translate-x-1">←</span>
                <span className="truncate whitespace-nowrap">{prevActionLabel}</span>
              </Link>
            ) : (
              <div />
            )}

            {nextActionLink ? (
              <Link
                href={nextActionLink}
                className="bg-red-900 text-white px-4 py-2 rounded font-normal hover:bg-red-800 transition-all flex items-center group shadow-md text-sm md:text-base max-w-[48.5%]"
              >
                <span className="truncate whitespace-nowrap">{nextActionLabel}</span>
                <span className="ml-2 transition-transform transform group-hover:translate-x-1 shrink-0">→</span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="order-2 col-span-1 px-3 py-4 space-y-4 lg:order-1 lg:col-span-3">
          <div className="space-y-4 lg:sticky lg:top-6">
            <ItemDetails book={item} />

            <TOCItem
              structure={{ title: 'সূচী' }}
              slug={effectiveSlug}
              currentChapter={effectiveSlug}
              currentPageNum={currentPageNum}
              mode="multi"
              allItemsList={filteredList}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}