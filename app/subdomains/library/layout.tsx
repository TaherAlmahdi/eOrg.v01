import React from 'react';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-full bg-slate-50 flex flex-col">
      {/* 🌟 লাইব্রেরির স্পেশাল হেডার */}
      <header className="bg-emerald-700 text-white shadow-md">
      </header>

      {/* লাইব্রেরি সাবডোমেনের মূল কন্টেন্ট */}
      <main className="flex-grow">{children}</main>
    </div>
  );
}