'use client';
import { Sparkles } from 'lucide-react';

const WelcomeBadge = () => {
  return (
    <div className="flex justify-center pt-4 md:pt-6">
      <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
        <Sparkles size={28} className="flex-shrink-0" />
        <h1 className="text-xl md:text-2xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
          <span className="text-[#008080]">বঙ্কিম</span> <span className="text-[#cc7a00]">রচনাবলীতে </span>স্বাগত!
        </h1>
      </div>
    </div>
  );
};

export default WelcomeBadge;