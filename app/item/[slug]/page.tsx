import { cache } from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import Notice from '@/app/components/Notice';
import BookDetails from '@/app/components/BookDetails';

import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { getBookBySlug } from '@/app/lib/books/singleItemExtract';
import { parseNoteShortcodes } from '@/app/lib/parse-shortcodes';

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
  subtitle?: string;
  pageNumber: number;
  contentHtml: string;
  notes: NoteItem[];
}

export interface ItemDetail {
  title: string;
  subtitle?: string;
  author?: string;
  translator?: string;
  editor?: string;
  content?: string;
  categoryName?: string; // যেমন: কবিতা, গল্প, নাটক
  categorySlug?: string; // যেমন: kobita, golpo
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  cover_image?: string;
  prevLink?: string;
  prevLabel?: string;
  nextLink?: string;
  nextLabel?: string;
  rawFrontmatter?: { notice?: string };
}

// ==========================================
// 🛠️ Helper Functions & Data Fetcher
// ==========================================

const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

function extractTargetSlug(params: PageParams): string[] {
  if (params.slug) {
    return Array.isArray(params.slug) ? params.slug : [params.slug];
  }
  if (params.itemSlug) {
    const itemSegments = Array.isArray(params.itemSlug) ? params.itemSlug : [params.itemSlug];
    if (params.titleSlug) {
      return [...itemSegments, params.titleSlug];
    }
    return itemSegments;
  }
  if (params.titleSlug) return [params.titleSlug];
  return [];
}

function resolveRouteSegments(rawSegments: string[]) {
  let cleanSegments = [...rawSegments];
  let pageNumFromPath: number | null = null;
  const lastSegment = rawSegments[rawSegments.length - 1];

  if (/^\d+$/.test(lastSegment) && rawSegments.length > 1) {
    pageNumFromPath = parseInt(lastSegment, 10);
    cleanSegments = rawSegments.slice(0, -1);
  }

  const fullItemSlug = cleanSegments.join('/');

  return {
    fullItemSlug,
    pageNumFromPath,
    cleanSegments,
  };
}

// 🎯 getBookBySlug এ ৩/৪টি প্যারামিটারের বদলে কেবল সিঙ্গেল স্ল্যাগ ও সাবডোমেইন পাঠানো হচ্ছে
async function fetchItemData(itemSlug: string, subdomain: string) {
  if (!itemSlug) return null;
  return await getBookBySlug(itemSlug);
}

const getItemData = cache(fetchItemData);

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

  let pageCounter = 2;
  for (let i = 1; i < pageSegments.length; i += 2) {
    const pageTitle = pageSegments[i] ? pageSegments[i].trim() : undefined;
    const pageBody = pageSegments[i + 1] || '';
    const parsed = parseNoteShortcodes(pageBody);

    splitPages.push({
      title: pageTitle,
      pageNumber: pageCounter,
      contentHtml: parsed.contentHtml,
      notes: parsed.notes,
    });
    pageCounter++;
  }

  return splitPages;
}

function resolveActivePageIndex(
  splitPages: SplitPage[],
  pageNumFromPath: number | null,
  queryPage?: string
): number {
  if (pageNumFromPath !== null && pageNumFromPath > 0 && pageNumFromPath <= splitPages.length) {
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

// ==========================================
// 🏷️ Dynamic Metadata Export
// ==========================================

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawSegments = extractTargetSlug(resolvedParams);

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  if (rawSegments.length === 0) {
    return { title: `আইটেম পাওয়া যায়নি ❀ ${siteName}` };
  }

  const { fullItemSlug, pageNumFromPath } = resolveRouteSegments(rawSegments);

  const item: ItemDetail | null = await getItemData(
    fullItemSlug,
    siteData.subdomain || 'library'
  );

  if (!item) {
    return { title: `আইটেম পাওয়া যায়নি ❀ ${siteName}` };
  }

  const splitPages = parseItemSubPages(item.content || '');
  const activePageIndex = resolveActivePageIndex(splitPages, pageNumFromPath, resolvedSearchParams.page);
  const currentSubPage = splitPages[activePageIndex];
  const currentPageNum = activePageIndex + 1;

  const titleParts: string[] = [];

  if (currentSubPage?.title) {
    titleParts.push(currentSubPage.title);
  } else if (currentPageNum > 1) {
    titleParts.push(`পাতা ${toBengaliNumber(currentPageNum)}`);
  }

  const pageDisplayTitle = titleParts.join(' ❀ ');

  const dynamicMetaTitle = buildTabTitle({
    metaTitle: item.meta_title,
    currentPageTitle: pageDisplayTitle || undefined,
    bookTitle: item.title,
    siteName: siteName,
  });

  const description =
    item.meta_description ||
    `${item.title}${item.author ? ` - ${item.author}` : ''} | এডুলিচার সাহিত্য সংকলন।`;

  const domainUrl = siteData.subdomain
    ? `https://${siteData.subdomain}.eduliture.org`
    : 'https://eduliture.org';

  const canonicalUrl = `${domainUrl}/${rawSegments.join('/')}`;

  const fallbackOgUrl = `/api/og?title=${encodeURIComponent(item.title)}&subtitle=${encodeURIComponent(
    item.subtitle || siteName
  )}&tagline=${encodeURIComponent('এডুলিচার অনলাইন বই ও সাহিত্য সংকলন')}`;

  const shareImage = item.og_image || item.cover_image || siteData.ogImage || fallbackOgUrl;

  return {
    title: dynamicMetaTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: dynamicMetaTitle,
      description,
      url: canonicalUrl,
      siteName: siteName,
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: item.title }] : [],
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

  if (rawSegments.length === 0) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const { fullItemSlug, pageNumFromPath, cleanSegments } = resolveRouteSegments(rawSegments);

  const item: ItemDetail | null = await getItemData(
    fullItemSlug,
    siteData.subdomain || 'library'
  );

  if (!item) {
    notFound();
  }

  const splitPages = parseItemSubPages(item.content || '');
  const activePageIndex = resolveActivePageIndex(splitPages, pageNumFromPath, resolvedSearchParams.page);

  const currentSubPageData = splitPages[activePageIndex] || splitPages[0];
  const currentPageNum = activePageIndex + 1;
  const totalSubPages = splitPages.length;

  let activeSubtitle: string | undefined;
  const fileSubtitle = item.subtitle?.trim();
  const pageSubtitle = currentSubPageData?.title?.trim();

  if (currentPageNum === 1) {
    activeSubtitle = fileSubtitle;
  } else {
    activeSubtitle = pageSubtitle;
  }

  const currentBasePath = `/${cleanSegments.join('/')}`;

  const getSubPageLabel = (pageData?: SplitPage) => {
    if (!pageData) return '';
    if (pageData.pageNumber === 1) return fileSubtitle || item.title;
    if (pageData.title) return pageData.title;
    return `পাতা ${toBengaliNumber(pageData.pageNumber)}`;
  };

  const categoryName = item.categoryName || 'কবিতা';
  const categorySlug = item.categorySlug || 'kobita';

  // Prev Button Logic
  let prevActionLink = item.prevLink || `/${categorySlug}`;
  let prevActionLabel = item.prevLabel || categoryName;

  if (currentPageNum > 1) {
    const prevPageNum = currentPageNum - 1;
    const prevPageObj = splitPages[prevPageNum - 1];
    prevActionLink = prevPageNum === 1 ? currentBasePath : `${currentBasePath}/${prevPageNum}`;
    prevActionLabel = getSubPageLabel(prevPageObj);
  }

  // Next Button Logic
  let nextActionLink = item.nextLink || `/${categorySlug}`;
  let nextActionLabel = item.nextLabel || `${categoryName}-এ ফিরে যান`;

  if (currentPageNum < totalSubPages) {
    const nextPageNum = currentPageNum + 1;
    const nextPageObj = splitPages[nextPageNum - 1];
    nextActionLink = `${currentBasePath}/${nextPageNum}`;
    nextActionLabel = getSubPageLabel(nextPageObj);
  }

  const rawNotice = item.rawFrontmatter?.notice;
  const pageNotice: string | null = typeof rawNotice === 'string' && rawNotice.trim().length > 0 ? rawNotice.trim() : null;

  const domainUrl = siteData.subdomain
    ? `https://${siteData.subdomain}.eduliture.org`
    : 'https://eduliture.org';

  const currentFullUrl = `${domainUrl}/${rawSegments.join('/')}`;
  const siteTitle = siteData.title || 'এডুলিচার';

  const fallbackOgUrl = `/api/og?title=${encodeURIComponent(item.title)}&subtitle=${encodeURIComponent(
    activeSubtitle || siteTitle
  )}&tagline=${encodeURIComponent('এডুলিচার অনলাইন সাহিত্য সংকলন')}`;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    author: {
      '@type': 'Person',
      name: item.author || 'অজানা লেখক',
    },
    ...(item.translator && {
      translator: {
        '@type': 'Person',
        name: item.translator,
      },
    }),
    ...(item.editor && {
      editor: {
        '@type': 'Person',
        name: item.editor,
      },
    }),
    url: currentFullUrl,
    image: item.og_image || item.cover_image || siteData.ogImage || fallbackOgUrl,
    description: item.meta_description || `${item.title}${item.author ? ` - ${item.author}` : ''} | এডুলিচার সাহিত্য সংকলন।`,
    inLanguage: 'bn',
    publisher: {
      '@type': 'Organization',
      name: siteTitle,
      url: domainUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentFullUrl,
    },
  };

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />

      {/* Breadcrumb Navigation */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="flex items-center max-w-full mx-auto text-sm font-tarunima whitespace-nowrap">
          <Link href="/" className="transition-colors shrink-0 hover:text-red-100">
            <Home size={16} />
          </Link>

          <span className="mx-2 text-white/50 shrink-0">/</span>

          <Link href="/series" className="transition-colors hover:text-red-100 shrink-0">
            সিরিজ
          </Link>

          <span className="mx-2 text-white/50 shrink-0">/</span>

          <Link href={`/${categorySlug}`} className="transition-colors hover:text-red-100 shrink-0">
            {categoryName}
          </Link>

          <span className="mx-2 text-white/50 shrink-0">/</span>

          <span className="font-medium text-white whitespace-nowrap">{item.title}</span>

          {totalSubPages > 1 && currentPageNum > 1 && (
            <>
              <span className="mx-2 text-white/50 shrink-0">/</span>
              <span className="font-medium text-white shrink-0">{getSubPageLabel(currentSubPageData)}</span>
            </>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <div className="grid max-w-full grid-cols-1 gap-0 mx-auto lg:grid-cols-12">
        {/* Content Section */}
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] shadow-sm min-h-screen">
          <header className="mb-0 text-center font-tarunima bg-[#f0f0f5] p-3 md:p-6">
            <h1 className="mb-2 text-lg font-semibold text-green-900 md:text-2xl font-tarunima">
              {item.title}
            </h1>

            {activeSubtitle && (
              <p className="mb-1 text-lg tracking-wide text-red-900 uppercase md:text-xl opacity-90">{activeSubtitle}</p>
            )}

            <div className="space-y-0.5 text-red-900 font-tarunima">
              {item.author && <p className="text-lg font-medium">{item.author}</p>}
              {item.translator && (
                <p className="text-base opacity-90">
                  অনুবাদ: <span className="font-medium">{item.translator}</span>
                </p>
              )}
              {item.editor && (
                <p className="text-base opacity-90">
                  সম্পাদনা: <span className="font-medium">{item.editor}</span>
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

            {/* Notes & Footnotes Section */}
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
                        className="flex-auto min-w-62.5 p-2 bg-white/70 hover:bg-white not-prose rounded border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition-all duration-200 text-sm md:text-base text-gray-800 flex items-start gap-1.5 font-tarunima"
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

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between p-3 md:p-6 mt-8 border-t border-orange-200 font-tarunima">
            <Link
              href={prevActionLink}
              className="bg-red-900 text-white px-4 py-2 rounded font-normal hover:bg-red-800 transition-all flex items-center group shadow-md text-sm md:text-base max-w-[60%]"
            >
              <span className="mr-2 transition-transform transform group-hover:-translate-x-1">←</span>
              <span className="truncate whitespace-nowrap">{prevActionLabel}</span>
            </Link>

            <Link
              href={nextActionLink}
              className="bg-red-900 text-white px-4 py-2 rounded font-normal hover:bg-red-800 transition-all flex items-center group shadow-md text-sm md:text-base max-w-[60%]"
            >
              <span className="truncate whitespace-nowrap">{nextActionLabel}</span>
              <span className="ml-2 transition-transform transform group-hover:translate-x-1 shrink-0">→</span>
            </Link>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="order-2 col-span-1 px-3 py-4 space-y-4 lg:order-1 lg:col-span-3">
          <div className="space-y-4 lg:sticky lg:top-6">
            <BookDetails book={item} />
          </div>
        </aside>
      </div>
    </main>
  );
}