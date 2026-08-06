import React from 'react';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { headers } from 'next/headers'; // 🟢 ডোমেন সনাক্ত করার জন্য
import { headerConfig, DomainConfig } from './lib/headerConfig';

// ডাটা টাইপ ইন্টারফেস
interface StoryItem {
  title: string;
  icon: string;
  externalLink: string;
  excerpt: string;
  order: number;
}

// MDX ফোল্ডার থেকে ডাটা ফেচ করার ফাংশন
async function getSubdomainsData(): Promise<StoryItem[]> {
  const targetDir = path.join(process.cwd(), 'content', 'pages', 'sucsess');

  if (!fs.existsSync(targetDir)) return [];

  const files = fs.readdirSync(targetDir);

  const stories = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(targetDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);

      return {
        title: data.title || 'শিরোনামহীন',
        icon: data.icon || '/logo/elogo.png',
        externalLink: data.externalLink || '#',
        excerpt: data.excerpt || '',
        order: typeof data.order === 'number' ? data.order : Infinity,
      };
    });

  return stories.sort((a, b) => a.order - b.order);
}

export default async function NotFound() {
  const stories = await getSubdomainsData();

  // 🟢 ১. হেডারস থেকে বর্তমান হোস্টনাম বের করা
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // 🟢 ২. কারেন্ট ডোমেন নির্ধারণ করা (headerConfig থেকে মেলানো)
  // যদি কোনো নির্দিষ্ট সাবডোমেন পাওয়া না যায়, তবে ডিফল্ট হিসেবে 'main' ব্যবহার হবে
  let currentKey = 'main';
  const domainKeys = Object.keys(headerConfig) as (keyof typeof headerConfig)[];

  for (const key of domainKeys) {
    const siteUrl = headerConfig[key].siteUrl;
    if (siteUrl && siteUrl.includes(host)) {
      currentKey = key;
      break;
    }
  }

  // বর্তমান সাইট ও মেইন সাইটের কনফিগ
  const currentConfig: DomainConfig = headerConfig[currentKey] || headerConfig.main;
  const mainConfig: DomainConfig = headerConfig.main;

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-6 bg-cover bg-center bg-no-repeat bg-fixed text-white overflow-x-clip"
      style={{ backgroundImage: "url('/bg03.png')" }}
    >
      {/* ব্যাকগ্রাউন্ড ওভারলে */}
      <div className="absolute inset-0 bg-[#ffcc66]/20 z-10 pointer-events-none backdrop-blur-[1px]" />

      {/* 🟢 ১. কারেন্ট ডোমেনের হেডার সেকশন */}
<header className="relative z-20 w-full max-w-full flex flex-col items-center text-center pt-4">
  {/* 🟢 404 GIF Image Container */}
  <div className="relative w-full max-w-[280px] sm:max-w-[480px] md:max-w-[480px] aspect-[509/337] mx-auto mb-2 overflow-hidden">
    <Image
      src="/404.gif" // আপনার জিফ ফাইলের সঠিক পাথ (public/images/404.gif বা public/404.gif অনুযায়ী দিন)
      alt="404 Page Not Found"
      fill
      className="object-contain"
      unoptimized // GIF অ্যানিমেশন যেন আটকে না যায় বা কোয়ালিটি লস না হয় তার জন্য
      priority
    />
  </div>
 
</header>

      {/* 🟢 ২. মূল ৪-০-৪ কন্টেন্ট */}
      <main className="relative z-20 w-full max-w-full text-center py-6 px-2 my-auto">

        <h3 className="text-2xl md:text-3xl font-bold mt-2 text-gray-900 font-tarunima">
          আপনি যা চাচ্ছেন তা পাওয়া যায়নি!
        </h3>
        <p className="text-gray-800 text-sm md:text-lg mt-2 mb-6 max-w-2xl mx-auto font-medium font-tarunima">
          অনুগ্রহ করে এডুলিচার বিশুদ্ধজ্ঞান প্রকল্পগুলোতে খোঁজ করুন।
        </p>

        {/* 🟢 ৩. সাবডোমেন সাইটের তালিকা */}
        <div className="flex flex-wrap gap-3 justify-start items-stretch relative px-2 z-20 w-full text-left">
          {stories.map((story, index) => (
            <a
              key={index}
              href={story.externalLink}
              className="flex items-center justify-center gap-1.25 px-3 py-2.5 rounded mb-1 bg-white/90 text-[#008080] border border-teal-100 shadow-sm text-center transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-lg hover:border-teal-300 hover:scale-[1.02] shrink-0 grow basis-full sm:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-0.75rem)] xl:basis-[calc(25%-0.75rem)] 2xl:basis-[calc(20%-0.75rem)] max-w-full group cursor-pointer overflow-hidden"
            >
              {/* বামে আইকন/লোগো */}
              <div className="relative w-12 h-12 shrink-0 overflow-hidden">
                <Image
                  src={story.icon}
                  alt={story.title}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>

              {/* ডানে টাইটেল ও ট্যাগলাইন */}
              <div className="grow text-left flex flex-col justify-center min-w-0">
                <h3 className="text-green text-lg md:text-xl font-semibold leading-snug font-tarunima truncate">
                  {story.title}
                </h3>
                {story.excerpt && (
                  <p className="text-gray-600 text-xs md:text-sm mt-1 font-normal font-tarunima line-clamp-2">
                    {story.excerpt}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>

        {/* 🟢 ৪. হোম পেজে ফেরার দুটি ডাইনামিক অপশন */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* যে সাবডোমেনে ভিজিটর বর্তমান আছে তার হোমে ফেরার লিংক */}
          <a
            href={currentConfig.siteUrl}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-md text-center font-tarunima"
          >
            {currentConfig.siteName}র হোমে ফিরে যান
          </a>

          {/* মূল এডুলিচার মেইন সাইটের হোমে ফেরার লিংক */}
          <a
            href={mainConfig.siteUrl}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-[#008080] bg-white hover:bg-teal-50 border border-teal-200 rounded transition-colors shadow-md text-center font-tarunima"
          >
            এডুলিচার মূল সাইটে ফিরে যান
          </a>
        </div>
      </main>

      {/* ফুটার */}
      <footer className="relative z-20 text-xs text-gray-700 pb-2 font-tarunima">
        &copy; {new Date().getFullYear()} {currentConfig.siteName}। সর্বস্বত্ব সংরক্ষিত।
      </footer>
    </div>
  );
}