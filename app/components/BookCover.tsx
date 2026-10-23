'use client';

import { COVER_BASE } from '@/app/lib/cover-base';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface BookCoverProps {
  coverImage?: string;
  title: string;
}

// 🔹 Cloudflare R2 Media Base URL ফরম্যাটিং হেল্পার (আপডেটেড)
const getCoverImageUrl = (coverPath?: string | null): string => {
  if (!coverPath) return '';

  // ১. যদি ইতোমধ্যে সম্পূর্ণ URL (http/https) হয়ে থাকে
  if (coverPath.startsWith('http://') || coverPath.startsWith('https://') || coverPath.startsWith(`${COVER_BASE}/`)) {
    return coverPath;
  }

  // ২. স্ল্যাশ ও স্পেস পরিচ্ছন্ন করা
  let cleanPath = coverPath.trim().replace(/\\/g, '/');

  // 'public/' বা '/public/' রিমুভ করা
  if (cleanPath.startsWith('public/')) {
    cleanPath = cleanPath.replace('public/', '');
  } else if (cleanPath.startsWith('/public/')) {
    cleanPath = cleanPath.replace('/public/', '');
  }

  cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

  // ৩. ডাবল এক্সটেনশন সমস্যা দূর করা (যেমন: .webp.webp বা .jpg.webp)
  cleanPath = cleanPath.replace(/\.(webp|jpg|png)\.(webp|jpg|png)$/i, '.$1');

  // ৪. যদি পাথে ইতিমধ্যে 'cover/' ফোল্ডার যুক্ত থাকে
  if (cleanPath.startsWith('cover/')) {
    return `${COVER_BASE}/${cleanPath}`;
  }

  // ৫. অন্যথায় সামনে 'cover/' ফোল্ডার যুক্ত করা
  return `${COVER_BASE}/cover/${cleanPath}`;
};

export default function BookCover({ coverImage, title }: BookCoverProps) {
  const [showCover, setShowCover] = useState(false);

  const formattedCoverUrl = getCoverImageUrl(coverImage);

  if (!formattedCoverUrl) return null;

  return (
    <div className="space-y-2 font-tarunima">
      {/* ১. প্রচ্ছদ ছবির ফুল-ওয়াইড আলাদা বর্ডার কার্ড (উপরে থাকবে) */}
      {showCover && (
        <div className="p-0 border border-gray-100 rounded shadow-sm overflow-hidden bg-white transition-all duration-300 ease-in-out">
          <img
            src={formattedCoverUrl}
            alt={title}
            decoding="async"
            className="w-full h-auto block object-cover"
          />
        </div>
      )}

      {/* ২. হেডার ও টগল বাটনের আলাদা বক্স (নিচে থাকবে) */}
      <div className="p-0 bg-white border border-gray-100 rounded shadow-sm flex items-center justify-between">
        <span className="font-bold p-2 tracking-wide text-red-900 uppercase text-md">
          পুস্তক বিবরণী
        </span>

        <button
          type="button"
          onClick={() => setShowCover(!showCover)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-900 transition-colors rounded bg-orange-50 hover:bg-orange-100"
        >
          {showCover ? (
            <>
              <EyeOff size={14} />
              <span>প্রচ্ছদ লুকান</span>
            </>
          ) : (
            <>
              <Eye size={14} />
              <span>প্রচ্ছদ দেখুন</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}