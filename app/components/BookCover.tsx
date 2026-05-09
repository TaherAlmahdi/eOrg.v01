'use client';
import { useState } from 'react';
import { Book, Eye, EyeOff, List } from 'lucide-react';

export default function BookCover({ coverImage, title }: { coverImage: string; title: string }) {
  const [showCover, setShowCover] = useState(true);

  if (!coverImage) return null;

  return (
    // items-start ব্যবহার করা হয়েছে যাতে প্রচ্ছদ হাইড হলেও কন্টেন্ট বাম দিকেই স্থির থাকে
    <div className="flex flex-col items-start w-full">

      {/* কন্ডিশনাল রেন্ডারিং */}
      {showCover && (
        <div className="w-full flex justify-center transition-all duration-500 ease-in-out mb-2">
          <img 
            src={coverImage} 
            alt={title} 
            className="w-full max-w-sm lg:max-w-full h-auto object-contain shadow-sm" 
          />
        </div>
      )}
      
      {/* বইয়ের নাম এবং শো/হাইড বাটন ইনলাইনে */}
      <div className="w-full flex items-center justify-between border-b border-red-300 pb-1">
        <h3 className="text-md font-bold text-red-900 flex items-center gap-2">
          <Book size={18} /> {title}
        </h3>

        {/* শো/হাইড কন্ট্রোল বাটন */}
        <button
          onClick={() => setShowCover(!showCover)}
          className="flex items-center gap-2 text-[14px] uppercase tracking-wider font-normal text-gray-400 hover:text-red-900 transition-colors shrink-0"
        >
          {showCover ? (
            <>
              <EyeOff size={14} /> প্রচ্ছদ লুকান
            </>
          ) : (
            <>
              <Eye size={14} /> প্রচ্ছদ দেখুন
            </>
          )}
        </button>
      </div>
    </div>
  );
}