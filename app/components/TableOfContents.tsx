"use client";

import Link from "next/link";

export interface TOCChapter {
  id?: string;
  slug: string;
  title: string;
}

export interface TOCVolume {
  type: "volume";
  id: string;
  title: string;
  chapters?: TOCChapter[];
}

export interface TOCDirectChapter {
  type: "chapter";
  id?: string;
  slug: string;
  volumeId?: string;
  title: string;
}

export interface MetaFile {
  title: string;
  slug: string;
}

export interface TOCStructure {
  bookTitle?: string;
  metaFiles?: MetaFile[];
  items?: (TOCVolume | TOCDirectChapter)[];
}

interface TableOfContentsProps {
  structure: TOCStructure;
  currentChapter?: string;
  currentVolume?: string;
  slug: string; // বইয়ের মূল slug
}

export default function TableOfContents({
  structure,
  currentChapter,
  currentVolume,
  slug,
}: TableOfContentsProps) {
  const items = structure?.items || [];
  const metaFiles = structure?.metaFiles || [];

  return (
    <nav aria-label="সূচিপত্র" className="text-sm space-y-2 max-h-[75vh] overflow-y-auto pr-1">
      {/* ১. মেটা ফাইলসমূহ (ভূমিকা, নিবেদন ইত্যাদি) */}
      {metaFiles.length > 0 && (
        <div className="pb-2 mb-2 border-b border-gray-200">
          <ul className="space-y-1">
            {metaFiles.map((meta) => (
              <li key={meta.slug}>
                <Link
                  href={`/book/${slug}/${meta.slug}`}
                  className="block px-2 py-1 text-gray-700 transition-colors rounded hover:text-red-900"
                >
                  {meta.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ২. খণ্ড ও অধ্যায়ের তালিকা */}
      {items.length === 0 ? (
        <p className="py-2 text-xs italic text-gray-500">কোনো সূচিপত্র পাওয়া যায়নি।</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            // ক. যদি খণ্ড (Volume) ভিত্তিক হয়
            if (item.type === "volume") {
              const isCurrentVol = currentVolume === item.id;

              return (
                <li key={item.id || index} className="space-y-1">
                  <Link
                    href={`/book/${slug}/${item.id}`}
                    className={`block font-bold px-2 py-1 rounded transition-colors ${
                      isCurrentVol
                        ? "text-red-900 bg-red-100/70"
                        : "text-gray-800 hover:text-red-900"
                    }`}
                  >
                    {item.title}
                  </Link>

                  {/* খণ্ডের ভিতরের অধ্যায়সমূহ */}
                  {item.chapters && item.chapters.length > 0 && (
                    <ul className="pl-3 ml-2 space-y-1 border-l-2 border-red-200">
                      {item.chapters.map((ch, chIdx) => {
                        const chSlug = ch.slug || ch.id || '';
                        const isCurrentCh = currentChapter === chSlug;

                        return (
                          <li key={chSlug || chIdx}>
                            <Link
                              href={`/book/${slug}/${item.id}/${chSlug}`}
                              className={`block text-xs md:text-sm py-1 px-1.5 rounded transition-colors ${
                                isCurrentCh
                                  ? "text-red-900 font-semibold bg-orange-100"
                                  : "text-gray-600 hover:text-red-900"
                              }`}
                            >
                              {ch.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            // খ. যদি সরাসরি অধ্যায় (Direct Chapter) ভিত্তিক হয়
            const chSlug = item.slug || item.id || '';
            const isCurrentDirectCh = currentChapter === chSlug || (!currentChapter && currentVolume === chSlug);

            return (
              <li key={chSlug || index}>
                <Link
                  href={`/book/${slug}/${chSlug}`}
                  className={`block px-2 py-1 rounded transition-colors ${
                    isCurrentDirectCh
                      ? "text-red-900 font-semibold bg-orange-100"
                      : "text-gray-700 hover:text-red-900"
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}