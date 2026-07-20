import React from 'react';

interface Props {
  children: React.ReactNode;
  params: Promise<{ authorSlug: string }>;
}

export default async function AuthorLayout({ children, params }: Props) {
  const { authorSlug } = await params;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* 🌟 লেখকের স্পেশাল হেডার (যা ডাইনামিকলি লেখকের নাম দেখাবে) */}
      <header className="bg-amber-900 text-stone-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-serif font-bold capitalize">
            {authorSlug === 'bankim' ? 'বঙ্কিমচন্দ্র স্মারক আর্কাইভ' : `${authorSlug} আর্কাইভ`}
          </div>
          <nav className="space-x-6 text-sm">
            <a href="http://library.localhost:3000" className="hover:text-amber-300">মূল লাইব্রেরি</a>
            <a href="/biography" className="hover:text-amber-300">জীবনী</a>
            <a href="/novels" className="hover:text-amber-300">উপন্যাস সমগ্র</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow">{children}</main>
    </div>
  );
}