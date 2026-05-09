'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, FileText, Folder, List } from 'lucide-react';

export default function TableOfContents({ 
  structure, 
  currentChapter, 
  slug 
}: { 
  structure: any, 
  currentChapter: string, 
  slug: string 
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [structure.currentVolume]: true 
  });

  // একটি Ref তৈরি করা হলো কারেন্ট আইটেমকে ধরার জন্য
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // কারেন্ট চ্যাপ্টার পরিবর্তন হলে স্ক্রল করার লজিক
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // স্ক্রিনের টপে নিয়ে আসবে
      });
    }
  }, [currentChapter]);

  return (
    <div className="space-y-1 font-tarunima">
      {structure.items?.map((vol: any) => { 
        const isVolume = vol.type === 'volume';

        return (
          <div key={vol.id} className="border-b border-gray-100 last:border-0 pb-1">
            {isVolume ? (
              <>
                <button
                  onClick={() => toggleSection(vol.id)}
                  className="w-full flex items-center justify-between py-0 px-0 hover:bg-orange-50 transition-all text-red-900 font-medium text-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <Folder size={16} className="text-orange-400" />
                    {vol.title}
                  </span>
                  {openSections[vol.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {openSections[vol.id] && (
                  <div className="ml-4 mt-0 space-y-1 border-l-2 border-orange-100 pl-2">
                    {vol.chapters.map((chap: any) => {
                      const isActive = chap.slug === currentChapter;
                      return (
                        <Link
                          key={chap.slug}
                          ref={isActive ? activeItemRef : null} // শুধুমাত্র কারেন্ট লিংকে ref বসবে
                          href={`/book/${slug}/${vol.id}/${chap.slug}`}
                          className={`flex items-center gap-1 text-sm py-1 px-1 border-b border-red-300 transition-colors ${
                            isActive 
                            ? 'bg-red-900 text-white shadow-sm' 
                            : 'text-blue-500 hover:bg-orange-50'
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
              <Link
                ref={vol.id === currentChapter ? activeItemRef : null}
                href={`/book/${slug}/${vol.volumeId}/${vol.id}`}
                className={`flex items-center gap-1 text-sm py-1 px-1 rounded transition-colors ${
                  vol.id === currentChapter 
                  ? 'bg-red-900 text-white shadow-sm font-bold' 
                  : 'text-blue-700 hover:bg-orange-50'
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