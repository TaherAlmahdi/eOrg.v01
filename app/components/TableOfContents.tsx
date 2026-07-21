'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';

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

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div 
      className="space-y-1 font-tarunima overflow-y-auto max-h-screen relative no-scrollbar"
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

      {structure.items?.map((vol: any) => { 
        const isVolume = vol.type === 'volume';

        return (
          <div key={vol.id} className="border-b border-gray-100 last:border-0 pb-1">
            {isVolume ? (
              <>
                <div
                  className="w-full flex items-center justify-between py-0 px-0 hover:bg-orange-50 transition-all text-red-900 font-medium text-sm group"
                >
                  {/* ভলিউম নেম লিংক - এখন এটি সরাসরি ভলিউম পেজে নিয়ে যাবে */}
                  <Link 
                    href={`/book/${slug}/${vol.id}`}
                    className="flex items-center gap-1.5 grow py-1"
                  >
                    <Folder size={16} className="text-orange-400" />
                    <span className="hover:underline underline-offset-4 decoration-orange-300">
                      {vol.title}
                    </span>
                  </Link>

                  {/* টগল বাটন - শুধুমাত্র লিস্ট ওপেন/ক্লোজ করার জন্য */}
                  <button 
                    onClick={() => toggleSection(vol.id)}
                    className="p-1 hover:bg-orange-100 rounded-md transition-colors"
                  >
                    {openSections[vol.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>

                {openSections[vol.id] && (
                  <div className="ml-4 mt-0 space-y-1 border-l-2 border-orange-100 pl-2">
                    {vol.chapters.map((chap: any) => {
                      const isActive = chap.slug === currentChapter;
                      return (
                        <Link
                          key={chap.slug}
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