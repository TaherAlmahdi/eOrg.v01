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
    [structure.currentVolume]: true // বর্তমান ভলিউমটি ডিফল্টভাবে খোলা থাকবে
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

return (
  <div className="space-y-1 font-tarunima">
    {structure.items?.map((vol: any) => { 
      const hasChapters = vol.chapters && vol.chapters.length > 0;
      const isVolume = vol.type === 'volume';

        return (
          <div key={vol.id} className="border-b border-gray-100 last:border-0 pb-1">
            {isVolume ? (
              // যদি খণ্ড থাকে
              <>
                <button
                  onClick={() => toggleSection(vol.id)}
                  className="w-full flex items-center justify-between py-1 px-1 hover:bg-orange-50 rounded transition-all text-red-900 font-bold"
                >
                  <span className="flex items-center gap-1">
                    <Folder size={16} className="text-orange-400" />
                    {vol.title}
                  </span>
                  {openSections[vol.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {openSections[vol.id] && (
                  <div className="ml-4 mt-0 space-y-1 border-l-2 border-orange-100 pl-2">
                    {vol.chapters.map((chap: any) => (
                      <Link
                        key={chap.slug}
                        href={`/book/${slug}/${vol.id}/${chap.slug}`}
                        className={`flex items-center gap-1 text-sm py-1 px-1 rounded transition-colors ${
                          chap.slug === currentChapter 
                          ? 'bg-red-900 text-white shadow-sm' 
                          : 'text-blue-700 hover:bg-orange-50'
                        }`}
                      >
                        <FileText size={14} opacity={0.5} />
                        {chap.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // যদি খণ্ড না থাকে (সরাসরি অধ্যায়)
              <Link
                href={`/book/${slug}/${vol.volumeId}/${vol.id}`}
                className={`flex items-center gap-1 text-sm py-2 px-3 rounded transition-colors ${
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