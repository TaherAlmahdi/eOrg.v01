import Link from 'next/link';
import { Home } from "lucide-react";
import Notice from '@/app/components/Notice';
import TableOfContents from '@/app/components/TableOfContents';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { getBookBySlug, BookDetail } from '@/app/lib/books';
import { notFound } from 'next/navigation';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { parseNoteShortcodes } from '@/app/lib/parse-shortcodes';

import BookDetails from '@/app/components/BookDetails';

interface UnifiedPageProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

interface ChapterItem {
  slug: string;
  title: string;
}

interface VolumeItem {
  id: string;
  title: string;
  volume_title?: string;
  chapters?: ChapterItem[];
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

// সংখ্যা বাংলায় রূপান্তরের হেল্পার
const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)])
    : '';

// 🔹 হেলপার: কন্টেন্ট থেকে সাব-পেজ বিভাজন পার্সিং
function parseBookSubPages(fullContent: string): SplitPage[] {
  if (!fullContent) return [];

  const pageSegments = fullContent.split(/<!--\s*nextpage(?:\s+([\s\S]*?))?\s*-->/gi);
  const splitPages: SplitPage[] = [];

  // ১ম পেজ
  const firstChunk = pageSegments[0] || '';
  const parsedFirst = parseNoteShortcodes(firstChunk);
  splitPages.push({
    title: undefined,
    pageNumber: 1,
    contentHtml: parsedFirst.contentHtml,
    notes: parsedFirst.notes,
  });

  // পরবর্তী পেজসমূহ
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

// 🔹 হেলপার: স্লাগ পাথ থেকে স্লাগ টিউন ও বর্তমান পেজ নম্বর বিশ্লেষণ
function resolveRouteSegments(rawSegments: string[]) {
  let bookSlug = rawSegments[0] || '';
  let volumeOrChapterSlug = rawSegments[1] || '';
  let chapterSlug = rawSegments[2] || '';
  let pageNumFromPath: number | null = null;
  let cleanSegments = [...rawSegments];

  const lastSegment = rawSegments[rawSegments.length - 1];

  if (/^\d+$/.test(lastSegment) && rawSegments.length > 1) {
    pageNumFromPath = parseInt(lastSegment, 10);
    cleanSegments = rawSegments.slice(0, -1);
    bookSlug = cleanSegments[0] || '';
    volumeOrChapterSlug = cleanSegments[1] || '';
    chapterSlug = cleanSegments[2] || '';
  }

  return {
    bookSlug,
    volumeOrChapterSlug,
    chapterSlug,
    pageNumFromPath,
    cleanSegments,
  };
}

// 🏷️ Dynamic Metadata Export
export async function generateMetadata({ params, searchParams }: UnifiedPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawSegments = resolvedParams.slug || [];

  if (rawSegments.length === 0) return { title: "বই পাওয়া যায়নি" };

  const { bookSlug, volumeOrChapterSlug, chapterSlug, pageNumFromPath } = resolveRouteSegments(rawSegments);

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const book = await getBookBySlug(
    bookSlug, 
    siteData.subdomain || 'library', 
    volumeOrChapterSlug, 
    chapterSlug
  );

  if (!book) return { title: "বই পাওয়া যায়নি" };

  // সাব-পেজ প্রসেসিং
  const splitPages = parseBookSubPages(book.content || '');
  let activePageIndex = 0;

  if (pageNumFromPath !== null && pageNumFromPath > 0 && pageNumFromPath <= splitPages.length) {
    activePageIndex = pageNumFromPath - 1;
  } else if (resolvedSearchParams.page) {
    const queryNum = parseInt(resolvedSearchParams.page, 10);
    if (!isNaN(queryNum) && queryNum > 0 && queryNum <= splitPages.length) {
      activePageIndex = queryNum - 1;
    }
  }

  const currentSubPage = splitPages[activePageIndex];
  const currentPageNum = activePageIndex + 1;

  // খণ্ড ও চ্যাপ্টার রেজোলিউশন
  const volumes: VolumeItem[] = (book.volumes as VolumeItem[]) || [];
  const currentVolumeSlug = chapterSlug ? volumeOrChapterSlug : (volumes.length > 0 ? volumeOrChapterSlug : '');
  const currentVolObj = volumes.find(v => v.id === currentVolumeSlug);
  
  const displayVolumeTitle = book.volume_title || book.currentVolumeTitle || currentVolObj?.volume_title || currentVolObj?.title || '';
  const resolvedChapterTitle = book.chapter_title || book.currentChapterTitle || null;

  // সম্পূর্ণ পেজ টাইটেল চেইন গঠন
  const titleParts: string[] = [];
  
  if (resolvedChapterTitle) {
    titleParts.push(resolvedChapterTitle);
  }
  
  if (displayVolumeTitle) {
    titleParts.push(displayVolumeTitle);
  }

  if (currentSubPage?.title) {
    titleParts.unshift(currentSubPage.title);
  } else if (currentPageNum > 1) {
    titleParts.push(`পাতা ${toBengaliNumber(currentPageNum)}`);
  }

  const pageDisplayTitle = titleParts.join(' ❀ ');

  // 🎯 ট্যাব টাইটেল তৈরি
  const dynamicMetaTitle = buildTabTitle({
    metaTitle: book.meta_title,
    currentPageTitle: pageDisplayTitle || undefined,
    bookTitle: book.title,
    siteName: siteData?.title || 'এডুলিচার',
  });

  const description = book.meta_description || `${book.title} - একটি অমূল্য সৃষ্টি।`;
  const shareImage = book.og_image || book.cover_image || siteData.ogImage;
  const currentPath = rawSegments.join('/');

  return {
    title: dynamicMetaTitle,
    description,
    openGraph: {
      title: dynamicMetaTitle,
      description,
      url: `https://${siteData.subdomain ? `${siteData.subdomain}.` : ''}eduliture.org/book/${currentPath}`,
      siteName: siteData.title,
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: book.title }] : [],
      locale: 'bn_BD',
      type: 'book',
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicMetaTitle,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

// 📖 Main Page Component
export default async function UnifiedBookPage({ params, searchParams }: UnifiedPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const rawSegments = resolvedParams.slug || [];

  if (rawSegments.length === 0) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const { bookSlug, volumeOrChapterSlug, chapterSlug, pageNumFromPath, cleanSegments } = resolveRouteSegments(rawSegments);

  const book: BookDetail | null = await getBookBySlug(
    bookSlug, 
    siteData.subdomain || 'library', 
    volumeOrChapterSlug, 
    chapterSlug
  );

  if (!book) notFound();

  const volumes: VolumeItem[] = (book.volumes as VolumeItem[]) || [];
  const directChapters: ChapterItem[] = (book.directChapters as ChapterItem[]) || [];

  // 🔍 সঠিক Volume এবং Chapter এর টাইটেল রেজোলিউশন
  const currentVolumeSlug = chapterSlug ? volumeOrChapterSlug : (volumes.length > 0 ? volumeOrChapterSlug : '');
  const currentChapterSlug = chapterSlug || (volumes.length === 0 ? volumeOrChapterSlug : '') || '';

  const currentVolObj = volumes.find(v => v.id === currentVolumeSlug);
  const displayVolumeTitle = book.volume_title || book.currentVolumeTitle || currentVolObj?.volume_title || currentVolObj?.title || '';
  const displayChapterTitle = book.chapter_title || book.currentChapterTitle || '';

  // 📝 <!--nextpage--> পার্সিং
  const splitPages = parseBookSubPages(book.content || '');

  // বর্তমান সাব-পেজ নির্বাচন
  let activePageIndex = 0;

  if (pageNumFromPath !== null && pageNumFromPath > 0 && pageNumFromPath <= splitPages.length) {
    activePageIndex = pageNumFromPath - 1;
  } else if (resolvedSearchParams.page) {
    const queryNum = parseInt(resolvedSearchParams.page, 10);
    if (!isNaN(queryNum) && queryNum > 0 && queryNum <= splitPages.length) {
      activePageIndex = queryNum - 1;
    }
  }

  const currentSubPageData = splitPages[activePageIndex] || splitPages[0];
  const currentPageNum = activePageIndex + 1;
  const totalSubPages = splitPages.length;

  let activeSubtitle: string | undefined;
  const fileSubtitle = book.subtitle?.trim();
  const pageSubtitle = currentSubPageData?.title?.trim();

  if (currentPageNum === 1) {
    activeSubtitle = fileSubtitle;
  } else {
    activeSubtitle = pageSubtitle;
  }

  // 🎯 সঠিক পরিচ্ছেদ/ফাইলের মূল বেস পাথ (যা থেকে সাব-পেজের ইউআরএল তৈরি হবে)
  const currentBasePath = `/book/${cleanSegments.join('/')}`;

  // মূল চলতি ফাইলের টাইটেল (যা সাব-পেজ ১-এর জন্য নাম হিসেবে ব্যবহৃত হবে)
  const currentFileTitle = displayChapterTitle || displayVolumeTitle || book.title;

  // 🧭 ডাইনামিক সাব-পেজ লেবেল প্রসেসর
  const getSubPageLabel = (pageData?: SplitPage) => {
    if (!pageData) return '';
    
    // ১ম পেজের জন্য লজিক: সাবটাইটেল থাকলে সাবটাইটেল, না থাকলে মূল ফাইলের টাইটেল
    if (pageData.pageNumber === 1) {
      return fileSubtitle || currentFileTitle;
    }
    
    // পরবর্তী পেজগুলোর জন্য লজিক
    if (pageData.title) return pageData.title;
    return `পাতা ${toBengaliNumber(pageData.pageNumber)}`;
  };

  // 👈 ১. পূর্ববর্তী (Previous) বাটনের সম্পূর্ণ ফিক্সড লজিক
  let prevActionLink = book.prevLink || "/books";
  let prevActionLabel = book.prevLabel || "গ্রন্থাগার";

  if (currentPageNum > 1) {
    // 🅰️ আমরা যদি চলতি ফাইলেরই ২, ৩, ৪... নম্বর সাব-পেজে থাকি
    const prevPageNum = currentPageNum - 1;
    const prevPageObj = splitPages[prevPageNum - 1];
    
    if (prevPageNum === 1) {
      // ২ নম্বর পেজ থেকে ১ নম্বর পেজে যাওয়ার সময়
      prevActionLink = currentBasePath;
      prevActionLabel = getSubPageLabel(prevPageObj); 
    } else {
      // ৩, ৪... নম্বর পেজ থেকে তার আগের সাব-পেজে ফেরত যাওয়া
      prevActionLink = `${currentBasePath}/${prevPageNum}`;
      prevActionLabel = getSubPageLabel(prevPageObj);
    }
  } else {
    // 🅱️ আমরা ১ নম্বর পেজে আছি, তাই আগের ফাইল/অধ্যায়ে যাবে
    if (book.prevLink) {
      const prevFileTotalPages = (book as unknown as Record<string, unknown>).prevTotalPages as number | undefined;

      if (prevFileTotalPages && prevFileTotalPages > 1) {
        prevActionLink = `${book.prevLink}/${prevFileTotalPages}`;
      } else {
        prevActionLink = book.prevLink;
      }
      
      prevActionLabel = book.prevLabel || "আগের পরিচ্ছেদ";
    } else {
      prevActionLink = "/books";
      prevActionLabel = "গ্রন্থাগার";
    }
  }

  // 👉 ২. পরবর্তী (Next) বাটনের সম্পূর্ণ ফিক্সড লজিক
  let nextActionLink = book.nextLink || "/books";
  let nextActionLabel = book.nextLabel || "গ্রন্থাগার";

  if (currentPageNum < totalSubPages) {
    const nextPageNum = currentPageNum + 1;
    const nextPageObj = splitPages[nextPageNum - 1];
    nextActionLink = `${currentBasePath}/${nextPageNum}`;
    nextActionLabel = getSubPageLabel(nextPageObj);
  } else {
    if (book.nextLink) {
      nextActionLink = book.nextLink;
      nextActionLabel = book.nextLabel || "পরবর্তী পরিচ্ছেদ";
    } else if (!volumeOrChapterSlug) {
      if (volumes.length > 0) {
        nextActionLink = `/book/${bookSlug}/${volumes[0].id}`;
        nextActionLabel = volumes[0].title || volumes[0].volume_title || "প্রথম খণ্ড";
      } else if (directChapters.length > 0) {
        nextActionLink = `/book/${bookSlug}/${directChapters[0].slug}`;
        nextActionLabel = directChapters[0].title || "প্রথম অধ্যায়";
      }
    }
  }

  // 📂 TableOfContents-এর জন্য ডাটা স্ট্রাকচার (সাব-পেজ ডাটা ইনজেক্ট করা হয়েছে)
  const currentSubPagesData = totalSubPages > 1 
    ? splitPages.map(p => ({ pageNumber: p.pageNumber, title: getSubPageLabel(p) })) 
    : [];

  const tocStructure = {
    bookTitle: book.title,
    currentVolume: currentVolumeSlug,
    metaFiles: (book.metaFiles || []).map((meta: { slug: string; title: string; subPages?: { pageNumber: number; title?: string }[] }) => ({
      ...meta,
      subPages: (meta.slug === volumeOrChapterSlug || meta.slug === chapterSlug) 
        ? currentSubPagesData 
        : []
    })),
    items: volumes.length > 0
      ? volumes.map((v: VolumeItem) => {
          const displayTitle = 
            (v.id === currentVolumeSlug && displayVolumeTitle) 
            || v.volume_title 
            || v.title;

          const isThisVolumeActive = v.id === currentVolumeSlug || v.id === volumeOrChapterSlug;

          return {
            type: 'volume' as const,
            id: v.id,
            title: displayTitle,
            subPages: (isThisVolumeActive && !chapterSlug) ? currentSubPagesData : [],
            chapters: (v.chapters || []).map((c: ChapterItem) => {
              const isThisChapterActive = c.slug === chapterSlug || c.slug === volumeOrChapterSlug;

              return {
                id: c.slug,
                slug: c.slug,
                title: c.title,
                subPages: isThisChapterActive ? currentSubPagesData : []
              };
            }),
          };
        })
      : directChapters.map((c) => {
          const isThisChapterActive = c.slug === volumeOrChapterSlug || c.slug === chapterSlug;

          return {
            type: 'chapter' as const,
            id: c.slug,
            slug: c.slug,
            title: c.title,
            subPages: isThisChapterActive ? currentSubPagesData : []
          };
        }),
  };

  // 🔍 খণ্ড পেজ শনাক্তকরণ ও পরিচ্ছেদ তালিকা লজিক
  const isVolumePage = Boolean(volumeOrChapterSlug && !chapterSlug && volumes.length > 0);
  const currentVolumeData = isVolumePage ? volumes.find((v) => v.id === volumeOrChapterSlug) : null;
  const volumeChapters = currentVolumeData?.chapters || [];

  const rawTocOption = (book as unknown as Record<string, unknown>).toc;
  const isExplicitTocTrue = rawTocOption === true || rawTocOption === 'true';
  const isExplicitTocFalse = rawTocOption === false || rawTocOption === 'false';
  const hasNoContent = !(book.content || '').trim();

  const shouldShowVolumeChapterList = 
    isVolumePage && 
    volumeChapters.length > 0 && 
    !isExplicitTocFalse && 
    (isExplicitTocTrue || hasNoContent);

  // 📌 নোটিশ রিড করা
  const rawNotice = book.rawFrontmatter?.notice;
  const pageNotice: string | null = 
    (typeof rawNotice === 'string' && rawNotice.trim().length > 0)
      ? rawNotice.trim()
      : null;

  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      {/* ব্রেডক্রাম্ব নেভিগেশন */}
      <nav className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar">
        <div className="flex items-center max-w-full mx-auto text-sm font-tarunima whitespace-nowrap">
          <Link href="/" className="transition-colors shrink-0 hover:text-red-100">
            <Home size={16} />
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>
          <Link href="/books" className="transition-colors hover:text-red-100 shrink-0">
            গ্রন্থাগার
          </Link>
          <span className="mx-2 text-white/50 shrink-0">/</span>

          {volumeOrChapterSlug ? (
            <Link href={`/book/${bookSlug}`} className="transition-colors hover:text-red-100 shrink-0">
              {book.title}
            </Link>
          ) : (
            <span className="font-medium text-white whitespace-nowrap">{book.title}</span>
          )}

          {/* খণ্ড/ভলিউম লেভেল */}
          {volumeOrChapterSlug && (
            <>
              <span className="mx-2 text-white/50 shrink-0">/</span>
              {chapterSlug ? (
                <Link href={`/book/${bookSlug}/${volumeOrChapterSlug}`} className="transition-colors hover:text-red-100 shrink-0">
                  {displayVolumeTitle || volumeOrChapterSlug}
                </Link>
              ) : (
                <span className="font-medium text-white whitespace-nowrap">
                  {displayVolumeTitle || displayChapterTitle || volumeOrChapterSlug}
                </span>
              )}
            </>
          )}

          {/* অধ্যায় লেভেল */}
          {chapterSlug && (
            <>
              <span className="mx-2 text-white/50 shrink-0">/</span>
              <span className="font-medium text-white whitespace-nowrap">
                {displayChapterTitle || chapterSlug}
              </span>
            </>
          )}

          {/* 💡 ডাইনামিক সাব-পেজ ব্রেডক্রাম্ব */}
          {totalSubPages > 1 && currentPageNum > 1 && (
            <>
              <span className="mx-2 text-white/50 shrink-0">/</span>
              <span className="font-medium text-white shrink-0">
                {getSubPageLabel(currentSubPageData)}
              </span>
            </>
          )}
        </div>
      </nav>

      {/* মূল কন্টেন্ট ও সাইডবার লেআউট */}
      <div className="grid max-w-full grid-cols-1 gap-0 mx-auto lg:grid-cols-12">
        
        {/* কন্টেন্ট সেকশন */}

        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] shadow-sm min-h-screen">
          <header className="mb-0 text-center font-tarunima bg-[#f0f0f5] p-3 md:p-6">
            {/* ১. মূল বইয়ের নাম দেখাবে যদি আমরা কোনো খণ্ড বা পরিচ্ছেদে থাকি */}
            {(displayVolumeTitle || displayChapterTitle) && (
              <p className="mb-1 text-lg text-red-900 md:text-xl font-tarunima">{book.title}</p>
            )}

            {/* ২. খণ্ডের শিরোনাম দেখাবে (যদি থাকে) */}
            {displayVolumeTitle && (
              <p className="mb-1 tracking-wide text-gray-600 uppercase text-md md:text-lg">
                {displayVolumeTitle}
              </p>
            )}

            {/* ৩. প্রধান হেডার টাইটেল (পরিচ্ছেদের নাম, না থাকলে খণ্ডের নাম, তা না থাকলে বইয়ের নাম) */}
            <h1 className="mb-2 text-xl font-semibold text-gray-900 md:text-2xl font-sabrina">
              {displayChapterTitle || displayVolumeTitle || book.title}
            </h1>

            {/* ৪. সাবটাইটেল */}
            {activeSubtitle && (
              <p className="mb-1 text-lg tracking-wide text-red-900 uppercase md:text-xl opacity-90">
                {activeSubtitle}
              </p>
            )}

            {/* ৫. লেখকের নাম */}
            <p className="text-lg font-medium text-red-900 font-tarunima">{book.author}</p>
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

            {/* 📂 খণ্ডের পাতায় পরিচ্ছেদ তালিকা */}
            {shouldShowVolumeChapterList && (
              <div className="pt-4 mt-6 border-t border-red-900/20">
                <h3 className="mb-4 text-xl font-bold text-red-900 font-tarunima">
                  এই খণ্ডের পরিচ্ছেদসমূহ
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {volumeChapters.map((ch, idx) => (
                    <Link
                      key={ch.slug}
                      href={`/book/${bookSlug}/${volumeOrChapterSlug}/${ch.slug}`}
                      className="flex items-center gap-3 p-3 transition-colors border rounded-md border-orange-200/80 bg-white/60 hover:bg-white hover:border-red-900 group"
                    >
                      <span className="flex items-center justify-center text-xs font-semibold text-red-900 transition-colors bg-orange-100 rounded-full w-7 h-7 group-hover:bg-red-900 group-hover:text-white">
                        {toBengaliNumber(idx + 1)}
                      </span>
                      <span className="font-medium text-gray-800 group-hover:text-red-900">
                        {ch.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* টিকা ও ফুটনোট সেকশন */}
            
            {currentSubPageData?.notes && currentSubPageData.notes.length > 0 && (
              <div className="pt-6 mt-10 border-t-2 border-orange-200/80">
                {/* হেডার */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-red-900"></span>
                  <h4 className="text-lg md:text-xl font-bold text-red-900 font-tarunima">
                    টিকা ও মন্তব্য
                  </h4>
                </div>

                {/* টিকার তালিকা */}
                <ol className="flex flex-wrap ml-0 text-sm text-gray-700 list-outside not-prose gap-x-2 gap-y-1 md:text-base">
                  {currentSubPageData.notes.map((note) => {
                    const noteHtmlContent = typeof note.text === 'string' ? note.text : JSON.stringify(note.text);
                    
                    return (
                      <li 
                        key={note.id} 
                        id={`fn-${note.id}`} 
                        className="flex-auto min-w-62.5 p-2 bg-white/70 hover:bg-white not-prose rounded border border-orange-100 hover:border-orange-300 shadow-xs hover:shadow-md transition-all duration-200 text-sm md:text-base text-gray-800 flex items-start gap-1.5 font-tarunima"
                      >
                        {/* ১. টিকার নম্বর ব্যাজ */}
                        <span className="shrink-0 px-1.5 py-0.5 text-sm font-semibold text-blue-900 bg-blue-50 border border-blue-200/60 rounded transition-colors">
                          {note.label}.
                        </span>

                        {/* 🎯 ২. লেবেলের ঠিক পাশে রিটার্ন এরো বাটন */}
                        <a 
                          href={`#fnref-${note.id}`} 
                          className="shrink-0 w-3 h-5 flex items-center justify-center text-blue-600 hover:text-red-700 hover:bg-red-50 rounded transition-all text-base font-bold"
                          title="উপরে পাঠ্যের টিকায় ফিরে যান"
                        >
                          ↑
                        </a>

                        {/* ৩. HTML রেন্ডারিং মূল টেক্সট */}
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

          {/* 🧭 স্মার্ট নেভিগেশন বাটন */}
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

        {/* সাইডবার */}
        <aside className="order-2 col-span-1 px-3 py-4 space-y-4 lg:order-1 lg:col-span-3">
          <div className="space-y-4 lg:sticky lg:top-6">
            
            <BookDetails book={book} />
            
            <TableOfContents 
              structure={tocStructure} 
              currentChapter={currentChapterSlug || currentVolumeSlug}
              currentPageNum={currentPageNum}
              slug={bookSlug}
              bookTitle={book?.title} 
            />
          </div>
        </aside>

      </div>
    </main>
  );
}