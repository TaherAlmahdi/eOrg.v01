'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, FileText, Folder, List, X } from 'lucide-react';

export default function TableOfContents({ 
  structure, 
  currentChapter, 
  slug,
  bookTitle // বইয়ের নাম পাওয়ার জন্য নতুন প্রপ
}: { 
  structure: any, 
  currentChapter?: string, 
  slug: string,
  bookTitle?: string
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // কারেন্ট ভলিউম বা চ্যাপ্টার অটো-ওপেন রাখার লজিক
  useEffect(() => {
    if (structure?.currentVolume) {
      setOpenSections(prev => ({
        ...prev,
        [structure.currentVolume]: true
      }));
    }
  }, [structure?.currentVolume]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // সূচিপত্রের মূল তালিকা
  const renderTocContent = () => (
    <div 
      className="space-y-1 font-tarunima overflow-y-auto max-h-[65vh] lg:max-h-[75vh] relative no-scrollbar pr-1"
      style={{ 
        msOverflowStyle: 'none',  /* IE and Edge */
        scrollbarWidth: 'none',   /* Firefox */
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* মেটা ফাইলসমূহ (যেমন: ভূমিকা) */}
      {structure?.metaFiles && structure.metaFiles.length > 0 && (
        <div className="pb-2 mb-2 space-y-1 border-b border-gray-200">
          {structure.metaFiles.map((meta: any) => {
            const isActive = meta.slug === currentChapter;
            return (
              <Link
                key={meta.slug}
                href={`/book/${slug}/${meta.slug}`}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-1.5 text-sm py-1.5 px-2 rounded transition-colors ${
                  isActive 
                    ? 'bg-red-900 text-white font-bold' 
                    : 'text-gray-700 hover:bg-orange-50'
                }`}
              >
                <FileText size={14} opacity={0.6} />
                {meta.title}
              </Link>
            );
          })}
        </div>
      )}

      {/* মূল আইটেমস (ভলিউম ও চ্যাপ্টার) */}
      {structure?.items?.map((vol: any) => { 
        const isVolume = vol.type === 'volume';
        const isVolumeActive = vol.id === currentChapter || vol.slug === currentChapter;

        return (
          <div key={vol.id} className="pb-1 border-b border-gray-100 last:border-0">
            {isVolume ? (
              <>
                <div className="flex items-center justify-between w-full px-0 py-0 text-sm font-medium text-red-900 transition-all hover:bg-orange-50 group">
                  {/* ভলিউম নেম লিংক */}
                  <Link 
                    href={`/book/${slug}/${vol.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-1.5 grow py-1.5 px-1"
                  >
                    <Folder size={16} className="text-orange-400" />
                    <span className={`hover:underline underline-offset-4 decoration-orange-300 ${isVolumeActive ? 'font-bold' : ''}`}>
                      {vol.title}
                    </span>
                  </Link>

                  {/* টগল বাটন */}
                  {vol.chapters && vol.chapters.length > 0 && (
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

                {/* ভলিউমের ভেতরের চ্যাপ্টারসমূহ */}
                {openSections[vol.id] && vol.chapters && (
                  <div className="pl-2 mt-0 ml-4 space-y-1 border-l-2 border-orange-100">
                    {vol.chapters.map((chap: any) => {
                      const isActive = chap.slug === currentChapter || chap.id === currentChapter;
                      return (
                        <Link
                          key={chap.slug || chap.id}
                          href={`/book/${slug}/${vol.id}/${chap.slug || chap.id}`}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-1 text-sm py-1.5 px-2 border-b border-red-300/30 transition-colors ${
                            isActive 
                            ? 'bg-red-900 text-white shadow-sm font-medium' 
                            : 'text-gray-700 hover:text-red-900 hover:bg-orange-50'
                          }`}
                        >
                          <FileText size={14} opacity={0.5} />
                          {chap.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* ডায়রেক্ট চ্যাপ্টার (যদি ভলিউম না থাকে) */
              <Link
                href={`/book/${slug}/${vol.slug || vol.id}`}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-1 text-sm py-1.5 px-2 rounded transition-colors ${
                  (vol.slug || vol.id) === currentChapter 
                  ? 'bg-red-900 text-white shadow-sm font-bold' 
                  : 'text-gray-700 hover:text-red-900 hover:bg-orange-50'
                }`}
              >
                <FileText size={14} />
                {vol.title}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ১. ডেক্সটপ ভিউ: স্বাভাবিক সাইডবার */}
      <div className="hidden lg:block">
        {renderTocContent()}
      </div>

      {/* ২. মোবাইল ভিউ: ভাসমান (Floating) বাটন */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="fixed z-40 flex items-center justify-center p-3 text-white bg-red-900 rounded-full shadow-lg bottom-5 right-5 hover:bg-red-800 focus:outline-none"
          aria-label="সূচিপত্র খুলুন"
        >
          <List size={22} />
        </button>

        {/* ৩. মোবাইলে টগল করার পর ওপেন হওয়া ব্যাকড্রপ ও ড্রয়ার */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div 
              className="w-full max-w-lg p-4 bg-white rounded shadow-2xl max-h-[80vh] flex flex-col font-tarunima"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ড্রয়ারের হেডার: এখানে সূচিপত্রের বদলে বইয়ের টাইটেল দেখানো হচ্ছে */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
                <h3 className="font-bold text-red-900 text-md truncate pr-2">
                  {bookTitle || structure?.title || 'সূচিপত্র'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-gray-500 rounded-full hover:bg-gray-100 shrink-0"
                  aria-label="বন্ধ করুন"
                >
                  <X size={20} />
                </button>
              </div>

              {/* ড্রয়ারের ভেতর সূচিপত্র তালিকা */}
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