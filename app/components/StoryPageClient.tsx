'use client';

import Breadcrumb from '@/app/components/Breadcrumb';
import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Home, Search, BookOpen, Layers } from "lucide-react";
import { buildTabTitle } from '@/app/lib/get-site-data';
import { Story } from '@/lib/stories/story';
import { PostCard } from '@/app/components/PostCard'; // পূর্বে প্রস্তুত করা PostCard কম্পোনেন্ট

// 🔹 ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBengaliNumber = (num: number | string): string => {
  const englishToBengali: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return num.toString().replace(/\d/g, (digit) => englishToBengali[digit] || digit);
};

// 🔹 বাংলা ক্যারেক্টার ও স্পেস নরমালাইজেশন
const normalizeBengali = (text: string = ''): string => {
  return text
    .normalize('NFC')
    .replace(/\u09af\u09bc/g, 'য়')
    .replace(/\u09a1\u09bc/g, 'ড়')
    .replace(/\u09a2\u09bc/g, 'ঢ়')
    .replace(/\u09b0\u09bc/g, 'র')
    .replace(/['"‘’“”]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .trim();
};

// 🔹 আদ্যক্ষর (First Letter) বের করার ফাংশন
const getInitialLetter = (title: string = ''): string => {
  const cleanTitle = title.replace(/^['"‘’“”\s]+/, '').trim();
  if (!cleanTitle) return '';
  let firstChar = cleanTitle.charAt(0);
  if (/[a-zA-Z]/.test(firstChar)) {
    firstChar = firstChar.toUpperCase();
  }
  return firstChar;
};

// 🔹 Author ফরম্যাটিং হেল্পার
const getAuthorText = (author?: string | string[]): string => {
  if (!author) return '';
  return Array.isArray(author) ? author.join(', ') : author;
};

// 🔹 ডেস্কটপ (≥1024px) কিনা — SSR-এ false ধরা হয়
const DESKTOP_QUERY = '(min-width: 1024px)';
const subscribeDesktop = (onChange: () => void) => {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};
const getIsDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

interface StoriesPageClientProps {
  initialStories: Story[];
  siteTitle: string;
}

export default function StoriesPageClient({
  initialStories = [],
  siteTitle,
}: StoriesPageClientProps) {
  const isDesktop = useSyncExternalStore(subscribeDesktop, getIsDesktop, () => false);
  const limit = isDesktop ? 60 : 25;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('সব');

  // Visible count resets whenever the filters or page size change (no effect needed)
  const resetKey = `${searchQuery}|${selectedLetter}|${limit}`;
  const [loaded, setLoaded] = useState({ key: resetKey, count: limit });
  const visibleCount = loaded.key === resetKey ? loaded.count : limit;

  // ১. সর্টিং
  const sortedStories = useMemo(() => {
    const safeStories = Array.isArray(initialStories) ? initialStories : [];
    return [...safeStories].sort((a, b) => {
      const cleanA = (a.title || '').replace(/^['"‘’“”\s]+/, '');
      const cleanB = (b.title || '').replace(/^['"‘’“”\s]+/, '');
      return cleanA.localeCompare(cleanB, 'bn');
    });
  }, [initialStories]);

  // ২. বর্ণমালা তালিকা
  const availableAlphabets = useMemo(() => {
    const lettersSet = new Set<string>();
    sortedStories.forEach((story) => {
      const firstChar = getInitialLetter(story.title);
      if (firstChar) {
        lettersSet.add(firstChar);
      }
    });

    const sortedLetters = Array.from(lettersSet).sort((a, b) =>
      a.localeCompare(b, 'bn')
    );
    return ['সব', ...sortedLetters];
  }, [sortedStories]);

  // ৩. ফিল্টারিং
  const filteredStories = useMemo(() => {
    const normalizedQuery = normalizeBengali(searchQuery);
    const compactQuery = normalizedQuery.replace(/\s+/g, '');
    const normalizedSelectedLetter = normalizeBengali(selectedLetter);

    return sortedStories.filter((story) => {
      const normalizedTitle = normalizeBengali(story.title || '');
      const normalizedBookName = normalizeBengali(story.bookName || '');
      const normalizedAuthor = normalizeBengali(getAuthorText(story.author));

      const compactTitle = normalizedTitle.replace(/\s+/g, '');
      const compactBookName = normalizedBookName.replace(/\s+/g, '');
      const compactAuthor = normalizedAuthor.replace(/\s+/g, '');

      const titleMatches = normalizedTitle.includes(normalizedQuery) || compactTitle.includes(compactQuery);
      const bookNameMatches = normalizedBookName.includes(normalizedQuery) || compactBookName.includes(compactQuery);
      const authorMatches = normalizedAuthor.includes(normalizedQuery) || compactAuthor.includes(compactQuery);

      const matchesSearch = !compactQuery || titleMatches || bookNameMatches || authorMatches;

      const storyFirstChar = normalizeBengali(getInitialLetter(story.title));
      const matchesLetter = selectedLetter === 'সব' || storyFirstChar === normalizedSelectedLetter;

      return matchesSearch && matchesLetter;
    });
  }, [sortedStories, searchQuery, selectedLetter]);

  const currentStories = useMemo(() => {
    return filteredStories.slice(0, visibleCount);
  }, [filteredStories, visibleCount]);

  const hasMore = visibleCount < filteredStories.length;

  // ৪. ডায়নামিক ব্রাউজার ট্যাব টাইটেল
  useEffect(() => {
    let currentPageTitle = 'কথা ভাণ্ডার';

    if (searchQuery.trim()) {
      currentPageTitle = `কথা ভাণ্ডার ❀ খুঁজছেন: ${searchQuery.trim()}`;
    } else if (selectedLetter !== 'সব') {
      currentPageTitle = `কথা ভাণ্ডার ❀ ${selectedLetter}`;
    }

    document.title = buildTabTitle({
      currentPageTitle,
      siteName: siteTitle,
    });
  }, [searchQuery, selectedLetter, siteTitle]);

  return (
    <div className="flex w-full flex-col items-center justify-between mt-4 py-2 mb-4">
      {/* নেভিগেশন বার */}
      <Breadcrumb items={[{ label: 'কথা ভাণ্ডার' }]} />

      {/* মূল কনটেন্ট এরিয়া */}
      <div className="w-full mx-auto px-4 py-4">
        {/* হেডার ও ফিল্টার */}
        <div className="mb-4 border-b border-orange-200 pb-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full">
              {/* বামে আইকন (কথা ভাণ্ডার) */}
              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded shrink-0">
                <Layers className="text-[#996633]" size={28} />
              </div>

              {/* ডানে উপরে পেজ টাইটেল ও নিচে কাউন্টার */}
              <div className="text-left space-y-0.5">
                <h2 className="text-lg md:text-xl font-bold font-sabrina text-[#996633] leading-tight">
                  কথা ভাণ্ডার
                </h2>
                <p className="text-gray-500 italic font-tarunima text-sm">
                  {filteredStories.length > 0
                    ? `মোট ${toBengaliNumber(filteredStories.length)}টি গল্প আছে`
                    : "এই মুহূর্তে কোনো গল্প পাওয়া যায়নি"}
                </p>
              </div>
            </div>

            {/* সার্চ বার */}
            <div className="w-full md:w-80 relative flex items-center">
              <input
                type="text"
                placeholder="গল্প, বই বা কথকের নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 text-sm bg-white border border-orange-200 rounded shadow-xs focus:outline-none focus:ring-1 focus:ring-[#996633] focus:border-[#996633] text-gray-800 placeholder-gray-400 font-tarunima"
              />
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-sm text-gray-400 hover:text-gray-600 cursor-pointer font-tarunima"
                >
                  মুছুন
                </button>
              )}
            </div>
          </div>

          {/* আদ্যক্ষর ফিল্টার বাটন */}
          {availableAlphabets.length > 1 && (
            <div className="mt-3 w-full flex flex-wrap items-center justify-center gap-1 py-1.5 px-2 bg-orange-50/50 rounded border border-orange-100 text-sm sm:text-base font-tarunima shadow-xs">
              {availableAlphabets.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-3 py-1 rounded transition-all cursor-pointer ${selectedLetter === letter
                    ? 'bg-[#996633] text-white font-bold shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-orange-100 border border-gray-100'
                    }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* গল্পের গ্রিড (PostCard ব্যবহার করা হয়েছে) */}
        {currentStories.length === 0 ? (
          <div className="text-center py-12 font-tarunima text-gray-600">
            <BookOpen className="w-12 h-12 mx-auto text-orange-200 mb-2" />
            <p>আপনার অনুসন্ধান অনুযায়ী কোনো গল্প পাওয়া যায়নি।</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-2 border-b border-orange-100">
              {currentStories.map((story) => {
                const storySlug = story.slug;
                const authorText = getAuthorText(story.author);
                const translatorText = getAuthorText(story.translator);

                return (
                  <PostCard
                    key={storySlug}
                    post={{
                      uuid: story.uuid,
                      slug: storySlug,
                      title: story.title,
                      author: authorText,
                      translator: translatorText,
                      book: story.bookName,
                      views: story.views || 0,
                    }}
                  />
                );
              })}
            </div>

            {/* লোড মোর বাটন */}
            <div className="py-6 flex justify-center items-center">
              {hasMore && (
                <button
                  onClick={() => setLoaded({ key: resetKey, count: visibleCount + limit })}
                  className="px-6 py-2 bg-[#996633] text-white rounded font-tarunima text-sm hover:bg-[#805326] shadow-sm transition-all cursor-pointer"
                >
                  আরও দেখুন
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}