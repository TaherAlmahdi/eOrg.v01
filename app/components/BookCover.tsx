'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface BookCoverProps {
  coverImage?: string;
  title: string;
}

// 🔹 Cloudflare R2 Media Base URL ফরম্যাটিং হেল্পার
const getCoverImageUrl = (coverPath?: string | null): string => {
  if (!coverPath) return '';

  let rawPath = coverPath.trim().replace(/\\/g, '/');

  // 'public/' বা '/public/' রিমুভ করা
  if (rawPath.startsWith('public/')) {
    rawPath = rawPath.replace('public/', '');
  } else if (rawPath.startsWith('/public/')) {
    rawPath = rawPath.replace('/public/', '');
  }

  // শুরুর স্ল্যাশ বাদ দেওয়া
  const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

  // ফুল URL থাকলে সেটাই রিটার্ন করবে, অন্যথায় Cloudflare R2 URL যুক্ত করবে
  return cleanPath.startsWith('http://') || cleanPath.startsWith('https://')
    ? cleanPath
    : `https://media.eduliture.org/${cleanPath}`;
};

export default function BookCover({ coverImage, title }: BookCoverProps) {
  const [showCover, setShowCover] = useState(false);

  const formattedCoverUrl = getCoverImageUrl(coverImage);

  if (!formattedCoverUrl) return null;

  return (
    <div className="space-y-2 font-tarunima">
      {/* ১. প্রচ্ছদ ছবির ফুল-ওয়াইড আলাদা বর্ডার কার্ড (উপরে থাকবে) */}
      {showCover && (
        <div className="p-0 border border-gray-100 rounded shadow-sm overflow-hidden bg-white transition-all duration-300 ease-in-out">
          <img
            src={formattedCoverUrl}
            alt={title}
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