"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, User } from 'lucide-react';
import { Book } from '../lib/books';

export function BookCard({ book }: { book: Book }) {
  // ১. কভার ইমেজের পাথ ক্লিনিং ও ফরম্যাটিং লজিক
  let rawPath = (book.coverImage || '').trim().replace(/\\/g, '/');
  
  // যদি পাথের শুরুতে 'public/' বা '/public/' থাকে, তা বাদ দেওয়া
  if (rawPath.startsWith('public/')) {
    rawPath = rawPath.replace('public/', '');
  } else if (rawPath.startsWith('/public/')) {
    rawPath = rawPath.replace('/public/', '');
  }
  
  // নিশ্চিত করা যেন পাথের শুরুতে একটি মাত্র নিখুঁত স্ল্যাশ '/' থাকে
  const formattedCoverPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  // ইমেজ লোড হতে কোনো সমস্যা হলে তার জন্য স্টেট ব্যাকআপ
  const [imageError, setImageError] = useState(false);

  return (
    <Link 
      href={`/book/${book.slug}`}
      className="group flex flex-col h-full border border-slate-100 rounded bg-white p-3.5 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300"
    >
      {/* ইমেজ কন্টেইনার */}
      <div className="aspect-[3/4] w-full bg-gradient-to-tr from-slate-100 to-slate-50 rounded mb-3 flex flex-col items-center justify-center text-xs text-slate-400 font-medium relative overflow-hidden border border-slate-200/60 shadow-inner">
        {formattedCoverPath && !imageError ? (
          <img 
            src={formattedCoverPath} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <BookOpen className="w-8 h-8 mb-2 text-emerald-500/70" />
            <span className="tracking-wide text-[11px] text-slate-400">প্রচ্ছদ পাওয়া যায়নি</span>
          </div>
        )}
      </div>
      
      {/* টেক্সট কন্টেন্ট */}
      <div className="flex flex-col flex-grow justify-between pt-1">
        <div>
          <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5 truncate">
            <User className="w-3 h-3 text-slate-400" />
            {book.author}
          </p>
        </div>
      </div>
    </Link>
  );
}