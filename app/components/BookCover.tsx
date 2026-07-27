'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface BookCoverProps {
  coverImage?: string;
  title: string;
}

export default function BookCover({ coverImage, title }: BookCoverProps) {
  const [showCover, setShowCover] = useState(false);

  if (!coverImage) return null;

  return (
    <div className="space-y-3 font-tarunima">
      {/* ১. প্রচ্ছদ ছবির ফুল-ওয়াইড আলাদা বর্ডার কার্ড (উপরে থাকবে) */}
      {showCover && (
        <div className="p-0 border border-gray-100 rounded shadow-sm overflow-hidden bg-white transition-all duration-300 ease-in-out">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-auto block object-cover"
          />
        </div>
      )}

      {/* ২. হেডার ও টগল বাটনের আলাদা বক্স (নিচে থাকবে) */}
      <div className="p-3 bg-white border border-gray-100 rounded shadow-sm flex items-center justify-between">
        <span className="font-bold px-1 tracking-wide text-red-900 uppercase text-md">
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