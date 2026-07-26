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

interface UnifiedPageProps {
  params: Promise<{
    slug?: string[];
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

interface GenreLink {
  name: string;
  link: string;
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

interface SplitPage {
  title?: string;
  subtitle?: string;
  pageNumber: number;
  contentHtml: string;
  notes: any[];
}

// সংখ্যা বাংলায় রূপান্তরের হেল্পার
const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)])
    : '';

// 🏷️ Dynamic Metadata Export
export async function generateMetadata({ params }: UnifiedPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slugSegments = resolvedParams.slug || [];

  if (slugSegments.length === 0) return { title: "বই পাওয়া যায়নি" };

  let [bookSlug, volumeOrChapterSlug, chapterSlug] = slugSegments;

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

  // ভলিউম টাইটেল নির্ধারণ
  const currentVolObj = (book.volumes as VolumeItem[])?.find(v => v.id === volumeOrChapterSlug);
  const resolvedVolumeTitle = book.volume_title || book.currentVolumeTitle || currentVolObj?.volume_title || currentVolObj?.title || null;
  const resolvedChapterTitle = book.chapter_title || book.currentChapterTitle || null;

  const dynamicMetaTitle = buildTabTitle({
    metaTitle: book.meta_title,
    currentPageTitle: resolvedChapterTitle,
    volumePageTitle: resolvedVolumeTitle,
    bookTitle: book.title,
    siteName: siteData.title,
  });

  const description = book.meta_description || `${book.title} - একটি অমূল্য সৃষ্টি।`;
  const shareImage = book.og_image || book.cover_image || siteData.ogImage;
  const currentPath = slugSegments.join('/');

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
  
  let rawSegments = resolvedParams.slug || [];

  if (rawSegments.length === 0) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  let bookSlug = rawSegments[0];
  let volumeOrChapterSlug = rawSegments[1];
  let chapterSlug = rawSegments[2];

  let pageNumFromPath: number | null = null;
  const lastSegment = rawSegments[rawSegments.length - 1];

  // চেক করা হচ্ছে শেষ স্লাগটি পেজ নম্বর (/2, /3) কি না
  if (/^\d+$/.test(lastSegment) && rawSegments.length > 1) {
    pageNumFromPath = parseInt(lastSegment, 10);
    const pathWithoutPage = rawSegments.slice(0, -1);
    bookSlug = pathWithoutPage[0];
    volumeOrChapterSlug = pathWithoutPage[1];
    chapterSlug = pathWithoutPage[2];
  }

  let book: BookDetail | null = await getBookBySlug(
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
  const displayVolumeTitle = book.volume_title || book.currentVolumeTitle || currentVolObj?.volume_title || currentVolObj?.title || (currentVolumeSlug ? currentVolumeSlug.toUpperCase() : '');
  const displayChapterTitle = book.chapter_title || book.currentChapterTitle || '';

  // 📝 <!--nextpage--> পার্সিং
  const fullContent = book.content || '';
  const pageSegments = fullContent.split(/<!--\s*nextpage(?:\s+([\s\S]*?))?\s*-->/gi);
  
  const splitPages: SplitPage[] = [];
  
  // প্রথম অংশের কন্টেন্ট (Page 1)
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

      // বর্তমান md file-এর subtitle
      const fileSubtitle = book.subtitle?.trim();

      // nextpage title
      const pageSubtitle = currentSubPageData?.title?.trim();

      if (currentPageNum === 1) {
        activeSubtitle = fileSubtitle;
      } else {
        activeSubtitle = pageSubtitle;
      }

  // মূল পাতার বেস পাথ (পেজ নম্বর ছাড়া)
  const baseSegments = pageNumFromPath !== null ? rawSegments.slice(0, -1) : rawSegments;
  const currentBasePath = `/book/${baseSegments.join('/')}`;

  // 🧭 ডাইনামিক সাব-পেজ লেবেল প্রসেসর
  const getSubPageLabel = (pageData?: SplitPage) => {
    if (!pageData) return '';
    if (pageData.title) return pageData.title;
    return pageData.pageNumber > 1 ? `পাতা ${toBengaliNumber(pageData.pageNumber)}` : '';
  };

  let prevActionLink = book.prevLink || "/books";
  let prevActionLabel = book.prevLabel || "গ্রন্থাগার";

  let nextActionLink = book.nextLink || "/books";
  let nextActionLabel = book.nextLabel || "গ্রন্থাগার";

  // 👈 পূর্ববর্তী বাটনের ডাইনামিক লজিক
  if (currentPageNum > 1) {
    const prevPageNum = currentPageNum - 1;
    const prevPageObj = splitPages[prevPageNum - 1];
    
    if (prevPageNum === 1) {
      prevActionLink = currentBasePath;
      prevActionLabel = prevPageObj?.title || book.prevLabel || "আগের পরিচ্ছেদ";
    } else {
      prevActionLink = `${currentBasePath}/${prevPageNum}`;
      prevActionLabel = getSubPageLabel(prevPageObj);
    }
  }

  // 👉 পরবর্তী বাটনের ডাইনামিক লজিক
  if (currentPageNum < totalSubPages) {
    const nextPageNum = currentPageNum + 1;
    const nextPageObj = splitPages[nextPageNum - 1];
    nextActionLink = `${currentBasePath}/${nextPageNum}`;
    nextActionLabel = getSubPageLabel(nextPageObj);
  } else if (!book.nextLink) {
    if (!volumeOrChapterSlug) {
      if (volumes.length > 0) {
        nextActionLink = `/book/${bookSlug}/${volumes[0].id}`;
        nextActionLabel = volumes[0].title || volumes[0].volume_title || "প্রথম খণ্ড";
      } else if (directChapters.length > 0) {
        nextActionLink = `/book/${bookSlug}/${directChapters[0].slug}`;
        nextActionLabel = directChapters[0].title || "প্রথম অধ্যায়";
      }
    }
  }

  // 📂 TableOfContents-এর জন্য ডাটা স্ট্রাকচার
  const tocStructure = {
    bookTitle: book.title,
    currentVolume: currentVolumeSlug,
    metaFiles: book.metaFiles || [],
    items: volumes.length > 0
      ? volumes.map((v: VolumeItem) => {
          const displayTitle = 
            (v.id === currentVolumeSlug && displayVolumeTitle) 
            || v.volume_title 
            || v.title;

          return {
            type: 'volume' as const,
            id: v.id,
            title: displayTitle,
            chapters: (v.chapters || []).map((c: ChapterItem) => ({
              id: c.slug,
              slug: c.slug,
              title: c.title,
            })),
          };
        })
      : directChapters.map((c) => ({
          type: 'chapter' as const,
          id: c.slug,
          slug: c.slug,
          title: c.title,
        })),
  };

  // 🔍 খণ্ড পেজ শনাক্তকরণ ও পরিচ্ছেদ তালিকা লজিক
  const isVolumePage = Boolean(volumeOrChapterSlug && !chapterSlug && volumes.length > 0);
  const currentVolumeData = isVolumePage ? volumes.find((v) => v.id === volumeOrChapterSlug) : null;
  const volumeChapters = currentVolumeData?.chapters || [];

  const rawTocOption = (book as any).toc;
  const isExplicitTocTrue = rawTocOption === true || rawTocOption === 'true';
  const isExplicitTocFalse = rawTocOption === false || rawTocOption === 'false';
  const hasNoContent = !fullContent.trim();

  const shouldShowVolumeChapterList = 
    isVolumePage && 
    volumeChapters.length > 0 && 
    !isExplicitTocFalse && 
    (isExplicitTocTrue || hasNoContent);

    // 📌 কেবল বর্তমান ওপেন থাকা ফাইলের (.md) নোটিশ রিড করা
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
        <section className="order-1 lg:order-2 col-span-1 lg:col-span-9 bg-[#fff2e6] p-3 md:p-6 shadow-sm min-h-screen">
          <header className="mb-6 text-center font-tarunima">
            {/* বইয়ের নাম যদি খণ্ড বা চ্যাপ্টার থাকে */}
            {(displayVolumeTitle || displayChapterTitle) && (
              <p className="mb-1 text-lg text-red-900 md:text-xl font-tarunima">{book.title}</p>
            )}

            {/* ভলিউমের নাম */}
            {displayVolumeTitle && (
              <p className="mb-1 tracking-wide text-gray-600 uppercase text-md md:text-lg">
                {displayVolumeTitle}
              </p>
            )}

            {/* চ্যাপ্টারের নাম বা মূল টাইটেল */}
            <h1 className="mb-2 text-xl font-semibold text-gray-900 md:text-2xl font-sabrina">
              {displayChapterTitle || (!displayVolumeTitle ? book.title : '')}
            </h1>

            {/* নেক্সটপেজের কাস্টম টাইটেল অথবা মূল সাবটাইটেল */}
            {activeSubtitle && (
              <p className="mb-1 text-lg tracking-wide text-red-900 uppercase md:text-xl opacity-90">
                {activeSubtitle}
              </p>
            )}

            <p className="text-lg font-medium text-red-900 font-tarunima">{book.author}</p>
            <div className="w-48 h-0.5 bg-red-900/40 mx-auto mt-3"></div>
          </header>

          <article className="leading-relaxed prose text-gray-900 lg:xl max-w-none font-tarunima">
            {/* নোটিশ রেন্ডারিং (যদি শুধু এই চ্যাপ্টার/পাতায় থাকে) */}
            {pageNotice && <Notice message={pageNotice} />}

            {/* মূল টেক্সট */}
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
              <div className="pt-4 mt-8 border-t-2 border-orange-200">
                <h4 className="mb-2 text-xl font-bold text-red-900 font-tarunima">টিকা ও মন্তব্য</h4>
                <ol className="flex flex-wrap ml-0 text-xs text-gray-700 list-outside not-prose gap-x-4 gap-y-2 md:text-sm">
                  {currentSubPageData.notes.map((note) => (
                    <li 
                      key={note.id} 
                      id={`fn-${note.id}`} 
                      className="flex-auto min-w-62.5 mb-1 border-t border-white/60 pt-1 text-justify"
                    >
                      <span className="leading-normal text-gray-800">      
                        <span className="font-semibold text-blue-600 font-tarunima">{note.label}.</span>
                        <a 
                          href={`#fnref-${note.id}`} 
                          className="inline-block px-1 text-blue-500 transition-all hover:text-red-700 font-tarunima"
                          title="উপরে ফিরে যান"
                        >
                          ↑
                        </a>      
                        {typeof note.text === 'string' ? note.text : JSON.stringify(note.text)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </article>

          {/* 🧭 স্মার্ট নেভিগেশন বাটন */}
          <div className="flex items-center justify-between pt-4 mt-8 border-t border-orange-200 font-tarunima">
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
            {book.cover_image && (
              <div className="flex justify-center p-0 bg-white border border-gray-100 rounded shadow-sm">
                <img 
                  src={book.cover_image} 
                  alt={book.title} 
                  className="object-cover w-full h-auto max-w-xs rounded-sm lg:max-w-full" 
                />
              </div>
            )}

            {/* মেটাডাটা বক্স */}
            <div className="p-4 bg-white border border-gray-100 rounded shadow-sm font-tarunima">
              <h3 className="pb-2 mb-3 font-bold tracking-wide text-red-900 uppercase border-b border-gray-200 text-md">
                পুস্তক বিবরণী
              </h3>
              <div className="space-y-2 text-sm text-gray-800">
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">বই</span>
                  <span className="text-gray-400">:</span>
                  <span>{book.title}</span>
                </div>
                <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                  <span className="font-bold">লেখক</span>
                  <span className="text-gray-400">:</span>
                  <span>{book.author}</span>
                </div>
                {book.pub_medium && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">প্রথম প্রকাশ</span>
                    <span className="text-gray-400">:</span>
                    <span>{book.pub_medium}</span>
                  </div>
                )}
                {book.first_published && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">গ্রন্থরূপ</span>
                    <span className="text-gray-400">:</span>
                    <span>{toBengaliNumber(book.first_published)}</span>
                  </div>
                )}
                {book.source_book && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">অনুস্মৃতি</span>
                    <span className="text-gray-400">:</span>
                    <span>{toBengaliNumber(book.source_book)}</span>
                  </div>
                )}

                {book.genre && (
                  <div className="grid grid-cols-[80px_15px_1fr] items-baseline">
                    <span className="font-bold">ঘরানা</span>
                    <span className="text-gray-400">:</span>
                    <span className="flex flex-wrap gap-x-1">
                      {Array.isArray(book.genre) ? (
                        book.genre.map((g: string, index: number) => {
                          const linkObj = book.genre_links?.find((l: GenreLink) => l.name === g);
                          const isLast = index === (book.genre as string[]).length - 1;
                          return (
                            <span key={index}>
                              {linkObj ? (
                                <Link href={linkObj.link} className="text-blue-600 hover:underline">
                                  {toBengaliNumber(g)}
                                </Link>
                              ) : (
                                toBengaliNumber(g)
                              )}
                              {!isLast && <span className="mr-1">,</span>}
                            </span>
                          );
                        })
                      ) : (
                        toBengaliNumber(book.genre)
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ডায়নামিক সূচিপত্র (ToC) */}
            <div className="p-3 bg-white border border-gray-100 rounded shadow-sm font-tarunima">
              <h3 className="pb-2 mb-3 font-bold text-red-900 border-b border-gray-200 text-md">
                {book.title}
              </h3>
              <TableOfContents 
                structure={tocStructure} 
                currentChapter={currentChapterSlug}
                slug={bookSlug} 
              />
            </div>

          </div>
        </aside>

      </div>
    </main>
  );
}