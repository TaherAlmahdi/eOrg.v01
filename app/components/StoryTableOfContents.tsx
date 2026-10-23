'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { List, X, BookOpen, ChevronRight } from 'lucide-react';
import { useScrollActiveToTop } from './useScrollActiveToTop';

// --- Utility: ইংরেজি সংখ্যাকে বাংলায় রূপান্তরের ফাংশন ---
const toBengaliNumber = (num: number | string): string => {
  const englishToBengaliMap: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };

  // সংখ্যাকে অন্তত ২ অঙ্কের স্ট্রিংয়ে রূপান্তর (যেমন: 1 -> "01")
  const paddedNum = String(num).padStart(2, '0');

  return paddedNum.replace(/[0-9]/g, (digit) => englishToBengaliMap[digit] || digit);
};

// --- Type Definitions ---
export interface SubPageItem {
  pageNumber: number;
  title: string;
  subtitle?: string;
}

export interface TocStructure {
  storyTitle?: string;
  subPages?: SubPageItem[];
}

interface TableOfContentsProps {
  structure: TocStructure;
  currentPageNum?: number;
  slug: string; // Base story slug
  storyAuthor?: string | string[];
  storyTitle?: string;
}

export default function TableOfContents({
  structure,
  currentPageNum = 1,
  slug,
  storyTitle: propStoryTitle,
}: TableOfContentsProps) {
  // 🟢 ১. সমস্ত React Hooks কম্পোনেন্টের একেবারে শুরুতে আনকন্ডিশনালি ডিক্লেয়ার করা হলো
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const listScrollRef = useScrollActiveToTop(currentPageNum);

  // ড্রপডাউনের বাইরে ক্লিক করলে মেনু বন্ধ হওয়ার হ্যান্ডলার
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 🟢 ২. ডাটা প্রসেসিং
  const subPages = structure?.subPages || [];
  // গল্পের নাম সঠিক ব্যাকআপ ভ্যালুসহ
  const storyTitle = structure?.storyTitle || propStoryTitle || 'গল্পের নাম';

  // 🟢 ৩. সমস্ত Hook কল সম্পন্ন হওয়ার পরই আর্লি রিটার্ন করা হলো
  if (!subPages || subPages.length <= 1) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-24 z-50 font-tarunima"
    >
      {/* ১. উপরে ডানপাশে ভাসমান মেনু আইকন */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleMenu}
          className="flex items-center justify-center w-8 h-8 text-white bg-red-900 hover:bg-red-800 rounded shadow-md transition-all duration-200 focus:outline-none"
          aria-expanded={isOpen}
          aria-label="সূচিপত্র খুলুন"
        >
          <List size={16} />
        </button>
      )}

      {/* ২. ড্রপডাউন মেনু পপআপ */}
      {isOpen && (
        <div className="absolute right-0 top-0 w-fit bg-white border border-gray-200 rounded shadow-xl overflow-hidden animate-fadeIn">
          {/* হেডার: মূল গল্পের নাম ও ক্লোজ বাটন */}
          <div className="flex items-center justify-between bg-red-500 text-white">
            <div className="flex items-center gap-2 truncate px-2 py-2 pr-2">
              <BookOpen size={16} className="shrink-0 text-orange-200" />
              <p className="font-semibold text-sm truncate">{storyTitle}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-2 py-2 text-orange-100 hover:text-white rounded hover:bg-red-800 transition-colors shrink-0"
              aria-label="বন্ধ করুন"
            >
              <X size={16} />
            </button>
          </div>

          {/* সাব-পেজগুলোর তালিকা */}
          <div ref={listScrollRef} className="p-0 space-y-1 max-h-80 overflow-y-auto [scrollbar-width:thin]">
            {subPages.map((page) => {
              const isActive = page.pageNumber === currentPageNum;

              // ১ম পেজ হলে মূল স্লাগ, অন্যথা /pageNumber
              const pagePath =
                page.pageNumber === 1
                  ? `/story/${slug}`
                  : `/story/${slug}/${page.pageNumber}`;

              const displayLabel = page.subtitle
                ? `${page.title} : ${page.subtitle}`
                : page.title;

              return (
                <Link
                  key={page.pageNumber}
                  href={pagePath}
                  data-toc-active={isActive}
                  onClick={handleClose}
                  className={`group flex items-center justify-between gap-0 text-sm py-1 px-2 transition-colors ${isActive
                      ? 'bg-orange-100 text-red-900 group-hover:bg-orange-100 group-hover:text-red-900'
                      : 'text-gray-700 hover:text-red-700 hover:bg-orange-50'
                    }`}
                >
                  <span className="truncate leading-relaxed">
                    {toBengaliNumber(page.pageNumber)}. {displayLabel}
                  </span>

                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-opacity ${isActive
                        ? 'opacity-100 text-white'
                        : 'opacity-0 group-hover:opacity-100 text-red-900'
                      }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}