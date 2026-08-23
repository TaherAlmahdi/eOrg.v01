'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, FileText, List, X } from 'lucide-react';

export interface TOCItemProps {
  structure?: {
    title?: string;
  };
  slug?: string;
  currentChapter?: string;
  currentPageNum?: number;
  mode?: string;
  allItemsList?: Array<{
    slug?: string;
    title: string;
    subtitle?: string;
    author?: string;
    item?: string | { name?: string };
    type?: string;
    content?: string;
    [key: string]: unknown;
  }>;
}

interface SubPageInfo {
  pageNumber: number;
  title?: string;
  subtitle?: string;
}

// --- Memoized SubPage Helper Component ---
const SubPageList = memo(function SubPageList({
  subPages,
  basePath,
  currentPageNum,
  onItemClick,
  isCurrentItem,
}: {
  subPages?: SubPageInfo[];
  basePath: string;
  currentPageNum: number;
  onItemClick: () => void;
  isCurrentItem: boolean;
}) {
  if (!subPages || subPages.length <= 1) return null;

  return (
    <ul className="pl-4 mt-1 space-y-0.5 border-l-2 border-red-900/20 ml-2">
      {subPages.map((sub) => {
        const subUrl = sub.pageNumber === 1 ? basePath : `${basePath}/${sub.pageNumber}`;
        const isCurrentSub = isCurrentItem && currentPageNum === sub.pageNumber;
        const baseLabel = sub.title || `পাতা ${sub.pageNumber}`;
        const subLabel = sub.subtitle ? `${baseLabel} : ${sub.subtitle}` : baseLabel;

        return (
          <li key={sub.pageNumber}>
            <Link
              href={subUrl}
              onClick={onItemClick}
              className={`flex items-center gap-1 px-2 py-1 text-xs md:text-sm rounded truncate transition-colors ${
                isCurrentSub
                  ? 'bg-red-800 text-white font-medium shadow-xs'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-red-900'
              }`}
              title={subLabel}
            >
              <FileText size={12} opacity={0.6} />
              <span>{subLabel}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
});

export default function TOCItem({
  structure,
  slug,
  currentChapter,
  currentPageNum = 1,
  allItemsList = [],
}: TOCItemProps) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!allItemsList || allItemsList.length === 0) return null;

  // ১. বর্তমান আইটেমটি খুঁজে বের করা
  const currentItem = allItemsList.find(
    (item) => item.slug === currentChapter || item.slug === slug
  );

  if (!currentItem) return null;

  // ২. বর্তমান আইটেমের ধরন (Item Type) নির্ধারণ করা
  const getItemTypeName = (itemObj: typeof currentItem): string => {
    const rawItem = itemObj.item || itemObj.type;
    if (typeof rawItem === 'string') return rawItem.trim();
    if (typeof rawItem === 'object' && rawItem !== null && 'name' in rawItem) {
      return String(rawItem.name || '').trim();
    }
    return '';
  };

  const currentType = getItemTypeName(currentItem);

  // ৩. সমজাতীয় আইটেমগুলো ফিল্টার করা
  const filteredList = allItemsList.filter((item) => getItemTypeName(item) === currentType);

  // ৪. বর্তমান আইটেমের সঠিক ইনডেক্স বের করা
  const currentIndex = filteredList.findIndex(
    (item) => item.slug === currentChapter || item.slug === slug
  );

  if (currentIndex === -1) return null;

  // ৫. সিকোয়েন্স অনুযায়ী আগের ৫টি এবং পরের ৫টি আইটেম কেটে নেওয়া (Slice)
  const startIndex = Math.max(0, currentIndex - 10);
  const endIndex = Math.min(filteredList.length, currentIndex + 11);
  const slicedList = filteredList.slice(startIndex, endIndex);

  // স্লাগ ফরম্যাট করার হেল্পার
  const slugify = (text: string) =>
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0980-\u09FF\-]/g, '');

  // ৬. কন্টেন্ট থেকে nextpage সাব-পেজগুলো পার্স করার ফাংশন
  const parseSubPages = (content?: string): SubPageInfo[] => {
    if (!content) return [];
    const pageSegments = content.split(/<!--\s*nextpage(?:\s+([\s\S]*?))?\s*-->/gi);
    if (pageSegments.length <= 1) return [];

    const subPages: SubPageInfo[] = [];
    subPages.push({ pageNumber: 1 });

    for (let i = 1, pageCounter = 2; i < pageSegments.length; i += 2, pageCounter++) {
      const pageTitle = pageSegments[i] ? pageSegments[i].trim() : undefined;
      subPages.push({
        pageNumber: pageCounter,
        title: pageTitle,
      });
    }
    return subPages;
  };

  const activeItemSlug = currentItem.slug || slugify(currentItem.title);

  // কারেন্ট আইটেম অটো-ওপেন রাখার জন্য ইফেক্ট
  useEffect(() => {
    setOpenStates((prev) => ({
      ...prev,
      [activeItemSlug]: true,
    }));
  }, [activeItemSlug]);

  const toggleAccordion = useCallback((itemSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenStates((prev) => ({
      ...prev,
      [itemSlug]: !prev[itemSlug],
    }));
  }, []);

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const displayTitle = `${currentType} ${structure?.title || 'সূচী'}`;

  // ৭. মূল সূচিপত্র রেন্ডার করার ফাংশন
  const renderTocContent = () => (
    <ul className="space-y-1 text-sm overflow-y-auto max-h-[65vh] lg:max-h-[75vh] relative pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {slicedList.map((item, idx) => {
        const itemSlug = item.slug || slugify(item.title);
        const isCurrentItem = itemSlug === activeItemSlug;
        const itemUrl = `/item/${itemSlug}`;
        const subPages = parseSubPages(item.content);
        const hasSubPages = subPages.length > 1;
        const isOpen = openStates[itemSlug] ?? isCurrentItem;
        const itemDisplayTitle = item.subtitle ? `${item.title} : ${item.subtitle}` : item.title;

        return (
          <li key={idx} className="rounded transition-colors">
            <div
              className={`flex items-center justify-between px-2 py-1.5 rounded transition-colors ${
                isCurrentItem && currentPageNum === 1
                  ? 'bg-red-900 text-white font-medium'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-red-900'
              }`}
            >
              {/* মূল পেজের লিংক */}
              <Link
                href={itemUrl}
                onClick={handleCloseMobile}
                className="flex-1 truncate text-xs md:text-sm"
                title={itemDisplayTitle}
              >
                {itemDisplayTitle}
              </Link>

              {/* সাব-পেজ থাকলে টোগল বাটন */}
              {hasSubPages && (
                <button
                  type="button"
                  onClick={(e) => toggleAccordion(itemSlug, e)}
                  className={`p-0.5 ml-1 rounded transition-colors ${
                    isCurrentItem ? 'hover:bg-red-800 text-white/90' : 'hover:bg-orange-100 text-gray-500'
                  }`}
                  aria-label="Toggle subpages"
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
            </div>

            {/* সাব-পেজ লিস্ট (হায়ারার্কি স্টাইল) */}
            {hasSubPages && isOpen && (
              <SubPageList
                subPages={subPages}
                basePath={itemUrl}
                currentPageNum={currentPageNum}
                onItemClick={handleCloseMobile}
                isCurrentItem={isCurrentItem}
              />
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* ১. ডেক্সটপ ভিউ */}
      <div className="hidden lg:block font-tarunima">
        <div className="p-3 bg-white border border-gray-100 rounded shadow-sm">
          <h3 className="mb-2.5 text-base font-medium text-red-900 border-b border-gray-100 pb-1.5 truncate">
            {displayTitle}
          </h3>
          {renderTocContent()}
        </div>
      </div>

      {/* ২. মোবাইল ভিউ (ফ্লোটিং বাটন এবং রেসপন্সিভ ড্রয়ার) */}
      <div className="lg:hidden font-tarunima">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="fixed z-40 flex items-center justify-center p-3 text-white bg-red-900 rounded-full shadow-lg bottom-5 right-5 hover:bg-red-800 focus:outline-none"
          aria-label="সূচী খুলুন"
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
              className="w-full max-w-lg p-4 bg-white rounded-t-xl shadow-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
                <h3 className="font-bold text-red-900 text-base truncate pr-2">
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