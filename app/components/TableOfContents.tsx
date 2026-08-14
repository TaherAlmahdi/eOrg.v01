'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, FileText, Folder, List, X } from 'lucide-react';

// --- Type Definitions ---
interface SubPageItem {
  pageNumber: number;
  title?: string;
}

interface ChapterItem {
  id?: string;
  slug: string;
  title: string;
  subPages?: SubPageItem[];
}

interface VolumeItem {
  type: 'volume' | 'chapter';
  id: string;
  slug?: string;
  title: string;
  chapters?: ChapterItem[];
  subPages?: SubPageItem[];
}

interface MetaItem {
  slug: string;
  title: string;
  subPages?: SubPageItem[];
}

interface TocStructure {
  title?: string;
  bookTitle?: string;
  currentVolume?: string;
  metaFiles?: MetaItem[];
  items?: VolumeItem[];
}

interface TableOfContentsProps {
  structure: TocStructure;
  currentChapter?: string;
  currentPageNum?: number;
  slug: string;
  bookTitle?: string;
}

// --- Memoized SubPage Helper Component ---
const SubPageList = memo(function SubPageList({
  subPages,
  basePath,
  currentPageNum,
  onItemClick,
}: {
  subPages?: SubPageItem[];
  basePath: string;
  currentPageNum: number;
  onItemClick: () => void;
}) {
  if (!subPages || subPages.length <= 1) return null;

  return (
    <div className="pl-2 mt-0 ml-4 space-y-1 border-l-2 border-orange-100/70">
      {subPages.map((subPage) => {
        const isSubActive = subPage.pageNumber === currentPageNum;
        const pagePath = subPage.pageNumber === 1 ? basePath : `${basePath}/${subPage.pageNumber}`;
        const displayLabel = subPage.title || `পাতা ${subPage.pageNumber}`;

        return (
          <Link
            key={subPage.pageNumber}
            href={pagePath}
            onClick={onItemClick}
            className={`flex items-center gap-1 text-xs py-1 px-2 rounded transition-colors ${
              isSubActive
                ? 'bg-red-800 text-white font-medium shadow-xs'
                : 'text-gray-600 hover:text-red-900 hover:bg-orange-50'
            }`}
          >
            <FileText size={12} opacity={0.6} />
            <span>{displayLabel}</span>
          </Link>
        );
      })}
    </div>
  );
});

// --- Main TableOfContents Component ---
export default function TableOfContents({
  structure,
  currentChapter,
  currentPageNum = 1,
  slug,
  bookTitle,
}: TableOfContentsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // কারেন্ট ভলিউম বা চ্যাপ্টার অটো-ওপেন রাখার লজিক
  useEffect(() => {
    const initialOpenState: Record<string, boolean> = {};

    if (structure?.currentVolume) {
      initialOpenState[structure.currentVolume] = true;
    }

    if (currentChapter) {
      initialOpenState[`chap-${currentChapter}`] = true;
      initialOpenState[currentChapter] = true;
    }

    setOpenSections((prev) => ({
      ...prev,
      ...initialOpenState,
    }));
  }, [structure?.currentVolume, currentChapter]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // বুক ফোল্ডারের ফাইল এবং সাবফোল্ডার আলাদা করার লজিক
  const directFiles = structure?.items?.filter((item) => item.type !== 'volume') || [];
  const volumes = structure?.items?.filter((item) => item.type === 'volume') || [];

  // সূচিপত্রের মূল তালিকা
  const renderTocContent = () => (
    <div className="space-y-1 font-tarunima overflow-y-auto max-h-[65vh] lg:max-h-[75vh] relative pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      
      {/* ১. মেটা ফাইলসমূহ (যদি থাকে) */}
      {structure?.metaFiles && structure.metaFiles.length > 0 && (
        <div className="pb-1 mb-1 space-y-0.5 border-b border-gray-200">
          {structure.metaFiles.map((meta) => {
            const isActive = meta.slug === currentChapter;
            const metaBasePath = `/book/${slug}/${meta.slug}`;
            const hasSubPages = Boolean(meta.subPages && meta.subPages.length > 1);
            const sectionKey = `meta-${meta.slug}`;

            return (
              <div key={meta.slug} className="space-y-0.5">
                <div className="flex items-center justify-between w-full">
                  <Link
                    href={metaBasePath}
                    onClick={handleCloseMobile}
                    className={`flex items-center gap-1.5 grow text-sm py-1.5 px-2 rounded transition-colors ${
                      isActive && currentPageNum === 1
                        ? 'bg-red-900 text-white font-bold'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <FileText size={14} opacity={0.6} />
                    <span>{meta.title}</span>
                  </Link>

                  {hasSubPages && (
                    <button
                      type="button"
                      onClick={() => toggleSection(sectionKey)}
                      className="p-1.5 transition-colors rounded-md hover:bg-orange-100 text-gray-600"
                      aria-label="Toggle Subpages"
                    >
                      {openSections[sectionKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>

                {hasSubPages && (isActive || openSections[sectionKey]) && (
                  <SubPageList
                    subPages={meta.subPages}
                    basePath={metaBasePath}
                    currentPageNum={currentPageNum}
                    onItemClick={handleCloseMobile}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ২. বুক ফোল্ডারের সরাসরি ফাইলসমূহ (ফাইলগুলো আগে আসবে) */}
      {directFiles.length > 0 && (
        <div className="pb-1 mb-2 space-y-0.5 border-b border-gray-200">
          {directFiles.map((file) => {
            const chapSlug = file.slug || file.id;
            const isChapActive = chapSlug === currentChapter;
            const chapBasePath = `/book/${slug}/${chapSlug}`;
            const chapHasSubPages = Boolean(file.subPages && file.subPages.length > 1);
            const chapKey = `direct-${chapSlug}`;

            return (
              <div key={chapSlug} className="space-y-0.5">
                <div className="flex items-center justify-between w-full">
                  <Link
                    href={chapBasePath}
                    onClick={handleCloseMobile}
                    className={`flex items-center gap-1.5 grow text-sm py-1.5 px-2 rounded transition-colors ${
                      isChapActive && currentPageNum === 1
                        ? 'bg-red-900 text-white shadow-sm font-bold'
                        : 'text-gray-700 hover:text-red-900 hover:bg-orange-50'
                    }`}
                  >
                    <FileText size={14} opacity={0.7} />
                    <span>{file.title}</span>
                  </Link>

                  {chapHasSubPages && (
                    <button
                      type="button"
                      onClick={() => toggleSection(chapKey)}
                      className="p-1.5 transition-colors rounded hover:bg-orange-100 text-gray-600"
                      aria-label="Toggle Subpages"
                    >
                      {openSections[chapKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>

                {chapHasSubPages && (isChapActive || openSections[chapKey]) && (
                  <SubPageList
                    subPages={file.subPages}
                    basePath={chapBasePath}
                    currentPageNum={currentPageNum}
                    onItemClick={handleCloseMobile}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ৩. বুক ফোল্ডারের সাবফোল্ডারসমূহ (Volumes / Sub-folders পরে আসবে) */}
      {volumes.length > 0 && (
        <div className="space-y-1">
          {volumes.map((vol) => {
            const volBasePath = `/book/${slug}/${vol.id}`;
            const isVolumeActive = vol.id === currentChapter || vol.slug === currentChapter;
            const volHasSubPages = Boolean(vol.subPages && vol.subPages.length > 1);

            return (
              <div key={vol.id} className="pb-1 border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between w-full px-0 py-0 text-sm font-medium text-red-900 transition-all hover:bg-orange-50 group">
                  <Link
                    href={volBasePath}
                    onClick={handleCloseMobile}
                    className="flex items-center gap-1.5 grow py-1.5 px-1"
                  >
                    <Folder size={16} className="text-orange-400" />
                    <span
                      className={`hover:underline underline-offset-4 decoration-orange-300 ${
                        isVolumeActive ? 'font-bold' : ''
                      }`}
                    >
                      {vol.title}
                    </span>
                  </Link>

                  {((vol.chapters && vol.chapters.length > 0) || volHasSubPages) && (
                    <button
                      type="button"
                      onClick={() => toggleSection(vol.id)}
                      className="p-1.5 transition-colors rounded-md hover:bg-orange-100"
                      aria-label="Toggle Section"
                    >
                      {openSections[vol.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                </div>

                {/* সাবফোল্ডারের (Volume) ভেতরের ফাইল বা সাব-পেজ */}
                {openSections[vol.id] && volHasSubPages && isVolumeActive && (
                  <SubPageList
                    subPages={vol.subPages}
                    basePath={volBasePath}
                    currentPageNum={currentPageNum}
                    onItemClick={handleCloseMobile}
                  />
                )}

                {/* সাবফোল্ডারের (Volume) ভেতরের চ্যাপ্টারসমূহ */}
                {openSections[vol.id] && vol.chapters && (
                  <div className="pl-2 mt-0 ml-4 space-y-1 border-l-2 border-orange-100">
                    {vol.chapters.map((chap) => {
                      const chapSlug = chap.slug || chap.id || '';
                      const isChapActive = chapSlug === currentChapter;
                      const chapBasePath = `/book/${slug}/${vol.id}/${chapSlug}`;
                      const chapHasSubPages = Boolean(chap.subPages && chap.subPages.length > 1);
                      const chapKey = `chap-${chapSlug}`;

                      return (
                        <div key={chapSlug} className="space-y-0.5">
                          <div className="flex items-center justify-between w-full">
                            <Link
                              href={chapBasePath}
                              onClick={handleCloseMobile}
                              className={`flex items-center gap-1 grow text-sm py-1.5 px-2 border-b border-red-300/30 transition-colors ${
                                isChapActive && currentPageNum === 1
                                  ? 'bg-red-900 text-white shadow-sm font-medium'
                                  : 'text-gray-700 hover:text-red-900 hover:bg-orange-50'
                              }`}
                            >
                              <FileText size={14} opacity={0.5} />
                              <span>{chap.title}</span>
                            </Link>

                            {chapHasSubPages && (
                              <button
                                type="button"
                                onClick={() => toggleSection(chapKey)}
                                className="p-1 transition-colors rounded hover:bg-orange-100 text-gray-600"
                                aria-label="Toggle Chapter Subpages"
                              >
                                {openSections[chapKey] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            )}
                          </div>

                          {chapHasSubPages && (isChapActive || openSections[chapKey]) && (
                            <SubPageList
                              subPages={chap.subPages}
                              basePath={chapBasePath}
                              currentPageNum={currentPageNum}
                              onItemClick={handleCloseMobile}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const displayTitle = bookTitle || structure?.title || 'সূচিপত্র';

  return (
    <>
      {/* ১. ডেক্সটপ ভিউ */}
      <div className="hidden lg:block">
        <div className="p-3 bg-white border border-gray-100 rounded shadow-sm font-tarunima">
          <h3 className="pb-2 mb-3 font-bold text-red-900 border-b border-gray-200 text-md truncate">
            {displayTitle}
          </h3>
          {renderTocContent()}
        </div>
      </div>

      {/* ২. মোবাইল ভিউ */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="fixed z-40 flex items-center justify-center p-3 text-white bg-red-900 rounded-full shadow-lg bottom-5 right-5 hover:bg-red-800 focus:outline-none"
          aria-label="সূচিপত্র খুলুন"
        >
          <List size={22} />
        </button>

        {isMobileOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={handleCloseMobile}
          >
            <div
              className="w-full max-w-lg p-4 bg-white rounded shadow-2xl max-h-[80vh] flex flex-col font-tarunima"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
                <h3 className="font-bold text-red-900 text-md truncate pr-2">
                  {displayTitle}
                </h3>
                <button
                  type="button"
                  onClick={handleCloseMobile}
                  className="p-1 text-gray-500 rounded-full hover:bg-gray-100 shrink-0"
                  aria-label="বন্ধ করুন"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto">
                {renderTocContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}