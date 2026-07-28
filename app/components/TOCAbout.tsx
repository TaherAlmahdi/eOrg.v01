'use client';

import React, { useState, useEffect } from 'react';
import { List, X } from 'lucide-react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TOCAboutProps {
  items: TocItem[];
}

export default function TOCAbout({ items }: TOCAboutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!items || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -40% 0px' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length === 0) return null;

  const handleScroll = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const TocList = () => (
    <nav className="space-y-2 font-tarunima p-0 m-0">
      <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 border-b pb-1 whitespace-nowrap">
        সূচিপত্র
      </p>
      
      {/* ফন্ট সাইজ text-sm থেকে বাড়িয়ে text-lg করা হয়েছে */}
      <ol className="bnlist space-y-1.5 text-sm p-0 m-0 list-none">
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          
          // h1 = 0px, h2 = 15px, h3 = 30px, h4 = 45px...
          const indentPx = (item.level - 1) * 15;

          return (
            <li
              key={`${item.id}-${index}`}
              style={{ marginLeft: `${indentPx}px` }}
              className="p-0"
            >
              <button
                onClick={() => handleScroll(item.id)}
                className={`text-left w-full transition-colors duration-150 whitespace-nowrap block p-0 ${
                  isActive
                    ? 'font-normal text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                {item.text}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return (
    <>
      {/* 🖥️ ডেস্কটপ ভার্সন */}
      <aside className="hidden lg:block shrink-0 w-fit max-w-md sticky top-20 h-auto">
        <div className="p-4 rounded border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <TocList />
        </div>
      </aside>

      {/* 📱 মোবাইল ভার্সন: ভাসমান আইকন বাটন */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-lg transition-transform active:scale-95"
          aria-label="সূচী"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      {/* 📱 মোবাইল ভার্সন: ড্রয়ার প্যানেল */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <span className="font-bold text-lg font-tarunima">সূচিপত্র</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <TocList />
          </div>
        </div>
      )}
    </>
  );
}