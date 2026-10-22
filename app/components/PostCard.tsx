'use client';

import Link from "next/link";
import { Eye } from "lucide-react";
import { customAuthorSlugs, customBookSlugs } from "@/scripts/stories-slug-map";


interface PostCardProps {
  post: {
    id?: string | number;
    uuid?: string;
    slug: string;
    title: string;
    author?: string;
    translator?: string;
    book?: string;
    date?: string;
    views?: number;
  };
}

// বাংলা সংখ্যায় রূপান্তর করার হেলপার
const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '০';

function generateSlug(text: string, customMap?: Record<string, string>): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (customMap && customMap[trimmed]) {
    return customMap[trimmed];
  }
  return trimmed
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '');
}

export function PostCard({ post }: PostCardProps) {
  const viewCount = post.views || 0;

  return (
    <article className="bg-white rounded shadow-sm border border-orange-200 hover:shadow-md transition-all group flex flex-col overflow-hidden h-full font-tarunima">
      {/* ব্যাকগ্রাউন্ডে bg-01.webp ইমেজযুক্ত কার্ডের মূল অংশ */}
      <Link
        href={`/story/${post.slug}`}
        className="block aspect-video relative w-full flex flex-col justify-between p-2 bg-cover bg-center overflow-hidden border-b border-orange-100"
        style={{ backgroundImage: `url('/bg-01.webp')` }}
      >
        {/* লেখার স্পষ্টতা বাড়াতে হালকা ওভারলে */}
        <div className="absolute inset-0 bg-white/70 group-hover:bg-white/60 transition-colors" />

        {/* উপরে বইয়ের নাম */}
        <div className="relative z-10 text-right">
          {post.book && (
            <span className="text-sm bg-white/90 text-orange-800 px-2.5 py-1 rounded border border-orange-200 line-clamp-1 inline-block shadow-xs">
              {post.book}
            </span>
          )}
        </div>

        {/* মাঝে গল্পের নাম, লেখক ও অনুবাদক */}
        <div className="relative z-10 text-center my-auto space-y-1.5">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-[#996633] leading-snug transition-colors line-clamp-2">
            {post.title}
          </h3>

          <div className="text-base sm:text-lg text-gray-700 font-medium space-y-0.5">
            {post.author && (
              <p className="line-clamp-1">{post.author}</p>
            )}
            {post.translator && (
              <p className="line-clamp-1 text-sm sm:text-base text-gray-600">অনুবাদক: {post.translator}</p>
            )}
          </div>
        </div>

        {/* নিচে ডেকোরেশন */}
        <div className="relative z-10 text-center">
          <span className="text-xs text-orange-600 tracking-widest">❖ ❖ ❖</span>
        </div>
      </Link>

      {/* কার্ডের নিচের ফুটার অংশ (একচুয়াল ভিউ সংখ্যা) */}
      <div className="p-3 flex items-center justify-between text-sm text-gray-600 bg-white">
        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
          <Eye size={16} className="text-[#996633]" />
          <span>{toBengaliNumber(viewCount)} বার পঠিত</span>
        </div>

        <Link href={`/story/${post.slug}`} className="text-[#996633] hover:underline font-medium">
          পড়ুন →
        </Link>
      </div>
    </article>
  );
}