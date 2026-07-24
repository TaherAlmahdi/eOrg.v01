import React from 'react';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'; // MDX frontmatter পার্স করার জন্য
import { Trophy } from 'lucide-react'; // এসভিজির পরিবর্তে Trophy আইকন ইম্পোর্ট করা হলো

// ডাটা টাইপ ইন্টারফেস
interface StoryItem {
  title: string;
  icon: string;
  externalLink: string;
  excerpt: string;
  order: number;
}

// MDX ফাইল থেকে ডাটা রিড করার ফাংশন
async function getSuccessStories(): Promise<StoryItem[]> {
  const targetDir = path.join(process.cwd(), 'content', 'pages', 'about');
  
  // যদি ফোল্ডারটি না থাকে তবে খালি অ্যারে রিটার্ন করবে
  if (!fs.existsSync(targetDir)) return [];

  const files = fs.readdirSync(targetDir);
  
  const stories = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(targetDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent); // frontmatter থেকে ডাটা রিড করবে
      
      return {
        title: data.title || 'শিরোনামহীন',
        icon: data.icon || '/logo/elogo.png', // ব্যাকআপ আইকন
        externalLink: data.externalLink || '#', // ব্যাকআপ লিংক
        excerpt: data.excerpt || '', // ফ্রন্টম্যাটার থেকে excerpt রিড করা হলো
        order: typeof data.order === 'number' ? data.order : Infinity, // অর্ডার না থাকলে শেষে যাবে
      };
    });

  // order নাম্বার অনুযায়ী ছোট থেকে বড় ক্রমানুসারে (Sorting) সাজানো হলো
  return stories.sort((a, b) => a.order - b.order);
}

export default async function SuccessStories() {
  const stories = await getSuccessStories();

  if (stories.length === 0) return null;

  return (
    <section 
      className="relative w-full h-auto bg-cover bg-center bg-no-repeat bg-fixed py-10 px-2 overflow-x-clip"
      style={{ backgroundImage: "url('/bg03.png')" }} 
    >
      
      <div className="absolute inset-0 bg-[#ffcc66]/20 z-10 pointer-events-none backdrop-blur-[1px]" />
      
      <div className="relative z-10 mx-auto w-full max-w-full overflow-hidden">
        
        {/* প্রধান হেডার সেকশন */}
        <div className="flex justify-center pt-2 md:pt-2">
          <div className="inline-flex items-center justify-center gap-3 px-6 py-2 rounded bg-teal-50 text-[#008080] mb-4 animate-pulse border border-teal-100 shadow-sm text-center">
            {/* এসভিজির বদলে Lucide-React এর Trophy আইকন */}
            <Trophy 
              size={28} 
              className="text-[#cc7a00] animate-bounce shrink-0" 
            />
            <h1 className="text-xl md:text-2xl font-tarunima p-2 font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">সাফল্য</span> <span className="text-[#cc7a00]">গাঁথা</span>
            </h1>
          </div>
        </div>

        <p className="max-w-full px-2 md:px-2 pb-2 text-justify text-lg md:text-xl leading-relaxed text-gray-800 font-medium">বাস্তবায়িত প্রতিটি প্রকল্পই আমাদের সাফল্যগাঁথার অংশ। এখানে রয়েছে আমাদের সম্পন্ন হওয়া ও বাস্তবায়নাধীন প্রকল্পসমূহের একটি তালিকা। এই প্রকল্পগুলোর সফল বাস্তবায়ন আমাদের কাজের পরিধি এবং গুণগত মানকে প্রকাশ করে। এডুলিচারের প্রথম সাফল্য ছিল ১৯৯৮ সালের ভাষা শহীদ দিবস উপলক্ষ্যে একটি সাহিত্য সঙ্কলন প্রকাশ। এরপর একই সালে বিদ্রোহী কবি ও বাংলাদেশের জাতীয় কবি কাজী নজরুল ইসলামের জন্মশতবার্ষিকী উপলক্ষ্যে নানান আয়োজন…
        </p>

        {/* CARD কন্টেইনার: সঠিক পিক্সেল পারফেক্ট গ্রিডের জন্য ফ্লুয়িড ফ্লেক্স উইডথ */}
        <div className="flex flex-wrap gap-3 justify-start items-stretch relative px-2 z-20 w-full">
          {stories.map((story, index) => (
            <a
              key={index}
              href={story.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.25 px-3 py-2.5 rounded mb-1 bg-white/90 text-[#008080] border border-teal-100 shadow-sm text-center transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-lg hover:border-teal-300 hover:scale-[1.02] shrink-0 grow basis-full sm:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-0.75rem)] xl:basis-[calc(25%-0.75rem)] 2xl:basis-[calc(20%-0.75rem)] max-w-full group cursor-pointer overflow-hidden"
            >

              <div className="relative w-12 h-12 shrink-0 overflow-hidden">
                <Image
                  src={story.icon}
                  alt={story.title}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>

              {/* ডানে টাইটেল ও ট্যাগ লাইন */}
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

      </div>
    </section>
  );
}