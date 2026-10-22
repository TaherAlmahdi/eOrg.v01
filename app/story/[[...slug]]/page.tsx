import Link from 'next/link';
import { Home, Eye } from 'lucide-react';
import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import Breadcrumb from '@/app/components/Breadcrumb';
import Notice from '@/app/components/Notice';
import TableOfContents from '@/app/components/StoryTableOfContents';
import BookDetails from '@/app/components/StoryDetails';
import StorySidebarLists from '@/app/components/StorySidebarLists';
import SidebarShell from '@/app/components/SidebarShell';

import { getStoryBySlug, getCurrentSlugForLegacy, StoryDetail } from '@/lib/stories/story';
import { parseNoteShortcodes } from '@/app/lib/parse-shortcodes';

// ==========================================
// 🌐 Constant Configuration
// ==========================================

const DOMAIN_URL = 'https://story.eduliture.org';
const SITE_NAME = 'কথামালা';

// ==========================================
// 📐 Interfaces
// ==========================================

interface StoryPageProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<{
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

// ==========================================
// 🛠️ Helper Functions
// ==========================================

const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

function parseStorySubPages(fullContent: string): SplitPage[] {
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

/** /api/og URL of the share card of a story: title, author(s), translator(s), book. */
function buildShareImage(story: StoryDetail): string {
  const names = (value?: string | string[]) => (Array.isArray(value) ? value.join('; ') : value || '');
  const params = new URLSearchParams({ title: story.title });
  if (names(story.author)) params.set('author', names(story.author));
  if (names(story.translator)) params.set('translator', names(story.translator));
  if (story.bookName) params.set('book', story.bookName);
  return `/api/og?${params.toString()}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveRouteSegments(rawSegments: string[]) {
  let storySlug = rawSegments[0] || '';
  let pageNumFromPath: number | null = null;

  const lastSegment = rawSegments[rawSegments.length - 1];

  if (/^\d+$/.test(lastSegment) && rawSegments.length > 1) {
    pageNumFromPath = parseInt(lastSegment, 10);
    storySlug = rawSegments[0] || '';
  }

  return {
    // Bengali slugs arrive percent-encoded; look them up as written in the database
    storySlug: safeDecode(storySlug),
    pageNumFromPath,
  };
}

function resolveActivePageIndex(
  splitPages: SplitPage[],
  pageNumFromPath: number | null,
  queryPage?: string
): number {
  if (
    pageNumFromPath !== null &&
    !isNaN(pageNumFromPath) &&
    pageNumFromPath > 0 &&
    pageNumFromPath <= splitPages.length
  ) {
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

export async function generateMetadata({ params, searchParams }: StoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawSegments = resolvedParams.slug || [];

  if (rawSegments.length === 0) return { title: `গল্প পাওয়া যায়নি ❀ ${SITE_NAME}` };

  const { storySlug, pageNumFromPath } = resolveRouteSegments(rawSegments);
  const story = await getStoryBySlug(storySlug);

  if (!story) return { title: `গল্প পাওয়া যায়নি ❀ ${SITE_NAME}` };

  const splitPages = parseStorySubPages(story.content || '');
  const activePageIndex = resolveActivePageIndex(splitPages, pageNumFromPath, resolvedSearchParams.page);

  const currentSubPage = splitPages[activePageIndex];
  const currentPageNum = activePageIndex + 1;

  const titleParts: string[] = [];

  if (currentSubPage?.title) {
    titleParts.push(currentSubPage.title);
  } else if (currentPageNum > 1) {
    titleParts.push(`পাতা ${toBengaliNumber(currentPageNum)}`);
  }

  titleParts.push(story.title);

  // tab title: story ❀ main author (not translator or editor) ❀ site
  const mainAuthor = Array.isArray(story.author) ? story.author[0] : story.author;
  if (mainAuthor) {
    titleParts.push(mainAuthor);
  }

  titleParts.push(SITE_NAME);

  const dynamicMetaTitle = titleParts.join(' ❀ ');

  const description =
    story.meta_description || `${story.title}${story.author ? ` - ${story.author}` : ''} | কথামালা সাহিত্য সংকলন।`;

  const canonicalUrl = `${DOMAIN_URL}/story/${encodeURIComponent(story.slug)}${currentPageNum > 1 ? `/${currentPageNum}` : ''}`;

  // share image: a card drawn like the story card of the site (see app/api/og)
  const shareImage = buildShareImage(story);

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
      siteName: SITE_NAME,
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: story.title }] : [],
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

export default async function StoryPage({ params, searchParams }: StoryPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawSegments = resolvedParams.slug || [];

  if (rawSegments.length === 0) {
    notFound();
  }

  const { storySlug, pageNumFromPath } = resolveRouteSegments(rawSegments);
  const story: StoryDetail | null = await getStoryBySlug(storySlug);

  if (!story) {
    // old file-name links (/story/017-story) go to the story's current slug
    const currentSlug = await getCurrentSlugForLegacy(storySlug);
    if (currentSlug) {
      const rest = rawSegments.slice(1).join('/');
      permanentRedirect(`/story/${encodeURIComponent(currentSlug)}${rest ? `/${rest}` : ''}`);
    }
    notFound();
  }

  // ---------------------------------------------------------
  // 👁️ View Counter Execution (by story id)
  // ---------------------------------------------------------
  const totalViews = story.views ?? 0;

  const splitPages = parseStorySubPages(story.content || '');
  const activePageIndex = resolveActivePageIndex(splitPages, pageNumFromPath, resolvedSearchParams.page);

  const currentSubPageData = splitPages[activePageIndex] || splitPages[0];
  const currentPageNum = Number(activePageIndex + 1);
  const totalSubPages = Number(splitPages.length);

  let activeSubtitle: string | undefined;
  const fileSubtitle = story.subtitle?.trim();
  const pageSubtitle = currentSubPageData?.title?.trim();

  if (currentPageNum === 1) {
    activeSubtitle = fileSubtitle;
  } else {
    activeSubtitle = pageSubtitle;
  }

  const currentBasePath = `/story/${encodeURIComponent(story.slug)}`;
  const mainAuthor = Array.isArray(story.author) ? story.author[0] : story.author;

  const getSubPageLabel = (pageData?: SplitPage) => {
    if (!pageData) return '';
    if (pageData.pageNumber === 1) return fileSubtitle || story.title;
    if (pageData.title) return pageData.title;
    return `পাতা ${toBengaliNumber(pageData.pageNumber)}`;
  };

  // ---------------------------------------------------------
  // 👈 পূর্ববর্তী (Previous) বাটন লজিক
  // ---------------------------------------------------------
  let prevActionLink = story.prevLink || '/stories';
  let prevActionLabel = story.prevLabel || 'কথা ভাণ্ডার';

  if (currentPageNum > 1) {
    const prevPageNum = currentPageNum - 1;
    const prevPageObj = splitPages[prevPageNum - 1];
    prevActionLink = prevPageNum === 1 ? currentBasePath : `${currentBasePath}/${prevPageNum}`;
    prevActionLabel = getSubPageLabel(prevPageObj);
  }

  // ---------------------------------------------------------
  // 👉 পরবর্তী (Next) বাটন লজিক
  // ---------------------------------------------------------
  let nextActionLink = story.nextLink || '/stories';
  let nextActionLabel = story.nextLabel || 'কথা ভাণ্ডার';

  if (currentPageNum < totalSubPages) {
    const nextPageNum = currentPageNum + 1;
    const nextPageObj = splitPages[nextPageNum - 1];
    nextActionLink = `${currentBasePath}/${nextPageNum}`;
    nextActionLabel = getSubPageLabel(nextPageObj);
  }

  const currentSubPagesData =
    totalSubPages > 1 ? splitPages.map((p) => ({ pageNumber: p.pageNumber, title: getSubPageLabel(p) })) : [];

  // ---------------------------------------------------------
  // 📚 Table of Contents (TOC) Structure Generation
  // ---------------------------------------------------------
  const tocStructure = {
    storyTitle: story.title,
    storyAuthor: story.author,
    subPages: currentSubPagesData,
  };

  const rawNotice = story.rawFrontmatter?.notice;
  const pageNotice: string | null =
    typeof rawNotice === 'string' && rawNotice.trim().length > 0 ? rawNotice.trim() : null;

  const rawCourtesy = story.rawFrontmatter?.courtesy;
  const pageCourtesy: string | null =
    typeof rawCourtesy === 'string' && rawCourtesy.trim().length > 0 ? rawCourtesy.trim() : null;

  const currentFullUrl = `${DOMAIN_URL}${currentBasePath}${currentPageNum > 1 ? `/${currentPageNum}` : ''}`;

  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: story.title,
    author: {
      '@type': 'Person',
      name: Array.isArray(story.author) ? story.author.join(', ') : story.author || 'অজানা লেখক',
    },
    ...(story.translator && {
      translator: {
        '@type': 'Person',
        name: Array.isArray(story.translator) ? story.translator.join(', ') : story.translator,
      },
    }),
    ...(story.editor && {
      editor: {
        '@type': 'Person',
        name: Array.isArray(story.editor) ? story.editor.join(', ') : story.editor,
      },
    }),
    url: currentFullUrl,
    image: `${DOMAIN_URL}${buildShareImage(story)}`,
    description:
      story.meta_description || `${story.title}${story.author ? ` - ${story.author}` : ''} | কথামালা সাহিত্য সংকলন।`,
    inLanguage: 'bn',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: DOMAIN_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentFullUrl,
    },
  };

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }} />

      {/* ব্রেডক্রাম্ব নেভিগেশন */}
      <Breadcrumb
        items={[
          { label: 'কথা ভাণ্ডার', href: '/stories' },
          ...(mainAuthor
            ? [
                story.peopleSlugs?.[mainAuthor]
                  ? { label: mainAuthor, href: `/author/${encodeURIComponent(story.peopleSlugs[mainAuthor])}` }
                  : { label: mainAuthor },
              ]
            : []),
          totalSubPages > 1 && currentPageNum > 1
            ? { label: story.title, href: currentBasePath }
            : { label: story.title },
          ...(totalSubPages > 1 && currentPageNum > 1 ? [{ label: getSubPageLabel(currentSubPageData) }] : []),
        ]}
      />

      {/* কন্টেন্ট ও সাইডবার লেআউট */}
      <div className="grid max-w-full grid-cols-1 gap-0 mx-auto lg:grid-cols-12">
        {/* কন্টেন্ট সেকশন */}
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] shadow-sm min-h-screen">
          <header className="mb-0 text-center font-tarunima bg-[#f0f0f5] p-3 md:p-6">
            <h1 className="mb-2 text-lg font-semibold text-green-900 md:text-xl font-tarunima">
              {story.title}
            </h1>

            {activeSubtitle && (
              <p className="mb-1 text-lg tracking-wide text-red-900 uppercase md:text-xl opacity-90">
                {activeSubtitle}
              </p>
            )}

            {/* লেখক, অনুবাদক ও সম্পাদক তথ্য */}
            <div className="space-y-0.5 text-red-900 font-tarunima">
              {story.author && (
                <p className="text-lg font-medium">
                  {Array.isArray(story.author) ? story.author.join(', ') : story.author}
                </p>
              )}
              {story.translator && (
                <p className="text-base opacity-90">
                  অনুবাদ:{' '}
                  <span className="font-medium">
                    {Array.isArray(story.translator) ? story.translator.join(', ') : story.translator}
                  </span>
                </p>
              )}
              {story.editor && (
                <p className="text-base opacity-90">
                  সম্পাদনা:{' '}
                  <span className="font-medium">
                    {Array.isArray(story.editor) ? story.editor.join(', ') : story.editor}
                  </span>
                </p>
              )}

              {/* 👁️ View Counter Badge */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-xs md:text-sm text-red-800/80 font-medium">
                <Eye size={16} className="inline text-red-800" />
                <span>{toBengaliNumber(totalViews)} বার পঠিত</span>
              </div>
            </div>

            <div className="w-48 h-0.5 bg-red-900/40 mx-auto mt-3"></div>
          </header>

          <article className="leading-relaxed prose text-gray-900 lg:xl max-w-none p-3 md:px-6 md:py-3 font-tarunima">
            <div>
              <TableOfContents
                structure={tocStructure}
                currentPageNum={currentPageNum}
                slug={story.slug}
                storyAuthor={story?.author}
                storyTitle={story?.title}
              />
            </div>

            {currentSubPageData?.contentHtml && (
              <div
                className="space-y-4 markdown-body"
                dangerouslySetInnerHTML={{ __html: currentSubPageData.contentHtml }}
              />
            )}

            {/* নোটিশ */}
            {pageNotice && (
              <div className="mt-8 mb-6">
                <Notice message={pageNotice} />
              </div>
            )}

            {/* কার্টেসি/সৌজন্যে */}
            {pageCourtesy && (
              <div className="mt-6 mb-6 text-sm md:text-base text-gray-600 italic border-l-4 border-red-900/30 pl-3 font-tarunima not-prose">
                সৌজন্যে: <span className="font-medium italic">{pageCourtesy}</span>
              </div>
            )}

            {/* টিকা ও ফুটনোট */}
            {currentSubPageData?.notes && currentSubPageData.notes.length > 0 && (
              <div className="pt-6 mt-10 border-t-2 border-orange-200/80">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-red-900"></span>
                  <h4 className="text-lg md:text-xl font-bold text-red-900 font-tarunima">টিকা ও মন্তব্য</h4>
                </div>

                <ol className="flex flex-wrap ml-0 text-sm text-gray-700 list-outside not-prose gap-x-1 gap-y-1 md:text-base">
                  {currentSubPageData.notes.map((note) => {
                    const noteHtmlContent =
                      typeof note.text === 'string' ? note.text : JSON.stringify(note.text);

                    return (
                      <li
                        key={note.id}
                        id={`fn-${note.id}`}
                        className="flex-auto min-w-auto p-1 bg-white/70 hover:bg-white not-prose rounded border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition-all duration-200 text-sm md:text-base text-gray-800 flex items-start gap-1 font-tarunima"
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

          {/* 🧭 নেভিগেশন বাটন */}
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

        {/* সাইডবার: বড় পর্দায় বামে, মোবাইলে নিচে-বামের ভাসমান বাটনে খোলে */}
        <SidebarShell>
          <BookDetails story={story} />
          <StorySidebarLists storyUuid={story.uuid} />
        </SidebarShell>
      </div>
    </main>
  );
}