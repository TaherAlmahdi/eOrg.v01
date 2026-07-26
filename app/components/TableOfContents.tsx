'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';

export default function TableOfContents({ 
  structure, 
  currentChapter, 
  slug 
}: { 
  structure: any, 
  currentChapter?: string, 
  slug: string 
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // কারেন্ট ভলিউম বা চ্যাপ্টার ওপেন রাখার স্টেট
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

  return (
    <div 
      className="space-y-1 font-tarunima overflow-y-auto max-h-[75vh] relative no-scrollbar pr-1"
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
                className={`flex items-center gap-1.5 text-sm py-1 px-1 rounded transition-colors ${
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

        return (
          <div key={vol.id} className="pb-1 border-b border-gray-100 last:border-0">
            {isVolume ? (
              <>
                <div className="flex items-center justify-between w-full px-0 py-0 text-sm font-medium text-red-900 transition-all hover:bg-orange-50 group">
                  {/* ভলিউম নেম লিংক */}
                  <Link 
                    href={`/book/${slug}/${vol.id}`}
                    className="flex items-center gap-1.5 grow py-1"
                  >
                    <Folder size={16} className="text-orange-400" />
                    <span className="hover:underline underline-offset-4 decoration-orange-300">
                      {vol.title} {/* 👈 সরাসরি vol.title প্রদর্শন করছে */}
                    </span>
                  </Link>

                  {/* টগল বাটন */}
                  {vol.chapters && vol.chapters.length > 0 && (
                    <button 
                      onClick={() => toggleSection(vol.id)}
                      className="p-1 transition-colors rounded-md hover:bg-orange-100"
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
                          className={`flex items-center gap-1 text-sm py-1 px-1 border-b border-red-300/30 transition-colors ${
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
              /* ডায়রেক্ট চ্যাপ্টার (যদি ভলিউম না থাকে) */
              <Link
                href={`/book/${slug}/${vol.slug || vol.id}`}
                className={`flex items-center gap-1 text-sm py-1 px-1 rounded transition-colors ${
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
}