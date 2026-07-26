"use client";

import Link from "next/link";

export interface TOCChapter {
  id?: string;
  slug: string;
  title: string;
  subChapters?: TOCChapter[]; // 👈 নেস্টেড সাব-ফোল্ডারের জন্য রেকারসিভ সাপোর্ট
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
  chapters?: TOCChapter[]; // 👈 ডাইরেক্ট চ্যাপ্টারের নিচে সাব-ফোল্ডার থাকলে
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
  slug: string; // বইয়ের মূল slug
}

// 🔁 সাব-ফোল্ডার বা নেস্টেড অধ্যায় রেন্ডার করার জন্য হেল্পার কম্পোনেন্ট
function ChapterTree({
  chapters,
  basePath,
  currentChapter,
}: {
  chapters: TOCChapter[];
  basePath: string;
  currentChapter?: string;
}) {
  if (!chapters || chapters.length === 0) return null;

  return (
    <ul className="pl-2 ml-1.5 space-y-0.5 border-l border-red-200">
      {chapters.map((ch, idx) => {
        const chSlug = ch.slug || ch.id || "";
        const fullPath = `${basePath}/${chSlug}`;
        const isCurrent = currentChapter === chSlug;

        return (
          <li key={chSlug || idx} className="my-0">
            <Link
              href={fullPath}
              className={`block text-base py-0.5 px-1 rounded transition-colors leading-tight ${
                isCurrent
                  ? "text-red-900 font-medium bg-orange-100"
                  : "text-gray-600 hover:text-red-900"
              }`}
            >
              {ch.title}
            </Link>

            {/* সাব-ফোল্ডারের ভেতরে আরও সাব-ফাইল/ফোল্ডার থাকলে তা রেন্ডার করবে */}
            {ch.subChapters && ch.subChapters.length > 0 && (
              <ChapterTree
                chapters={ch.subChapters}
                basePath={fullPath}
                currentChapter={currentChapter}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
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
    <nav aria-label="সূচিপত্র" className="text-base max-h-[75vh] overflow-y-auto pr-1">
      {/* ১. মেটা ফাইলসমূহ (ভূমিকা, নিবেদন ইত্যাদি) */}
      {metaFiles.length > 0 && (
        <div className="pb-1 mb-1 border-b border-gray-200">
          <ul className="space-y-0.5">
            {metaFiles.map((meta) => (
              <li key={meta.slug}>
                <Link
                  href={`/book/${slug}/${meta.slug}`}
                  className="block px-1 py-0.5 text-base text-gray-700 transition-colors rounded hover:text-red-900 leading-tight"
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
        <p className="py-1 text-2.1 italic text-gray-500">কোনো সূচিপত্র পাওয়া যায়নি।</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, index) => {
            // ক. যদি খণ্ড (Volume) ভিত্তিক হয়
            if (item.type === "volume") {
              const isCurrentVol = currentVolume === item.id;
              const volumeBasePath = `/book/${slug}/${item.id}`;

              return (
                <li key={item.id || index} className="space-y-0.5">
                  <Link
                    href={volumeBasePath}
                    className={`block text-base font-semibold px-1.5 py-0.5 rounded transition-colors leading-tight ${
                      isCurrentVol
                        ? "text-red-900 bg-red-100/80"
                        : "text-gray-800 hover:text-red-900"
                    }`}
                  >
                    {item.title}
                  </Link>

                  {/* খণ্ডের ভিতরের অধ্যায় ও সাব-ফোল্ডারসমূহ */}
                  {item.chapters && item.chapters.length > 0 && (
                    <ChapterTree
                      chapters={item.chapters}
                      basePath={volumeBasePath}
                      currentChapter={currentChapter}
                    />
                  )}
                </li>
              );
            }

            // খ. যদি সরাসরি অধ্যায় (Direct Chapter) বা সরাসরি কোনো সাব-ফোল্ডার হয়
            const chSlug = item.slug || item.id || "";
            const isCurrentDirectCh =
              currentChapter === chSlug || (!currentChapter && currentVolume === chSlug);
            const directBasePath = `/book/${slug}/${chSlug}`;

            return (
              <li key={chSlug || index} className="space-y-0.5">
                <Link
                  href={directBasePath}
                  className={`block text-base px-1.5 py-0.5 rounded transition-colors leading-tight ${
                    isCurrentDirectCh
                      ? "text-red-900 font-semibold bg-orange-100"
                      : "text-gray-700 hover:text-red-900"
                  }`}
                >
                  {item.title}
                </Link>

                {/* যদি ডাইরেক্ট চ্যাপ্টারের ভেতরেও সাব-ফোল্ডার/ফাইল থাকে */}
                {item.chapters && item.chapters.length > 0 && (
                  <ChapterTree
                    chapters={item.chapters}
                    basePath={directBasePath}
                    currentChapter={currentChapter}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}