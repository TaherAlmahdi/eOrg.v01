'use client';
import { Sparkles } from 'lucide-react';

const WelcomeBadge = () => {
  return (
    <div className="flex justify-center pt-4 md:pt-10">
      <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
        <Sparkles size={28} className="shrink-0" />
        <h1 className="text-xl md:text-3xl font-tarunima p-3 font-black text-gray-900 leading-none tracking-tight">
          <span className="text-[#008080]">এডুলিচারে</span> <span className="text-[#cc7a00]"> স্বাগতম</span>!
        </h1>
      </div>
    </div>
  );
};

export default WelcomeBadge;