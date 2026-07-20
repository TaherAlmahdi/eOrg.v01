import React from 'react';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import { Sparkles } from 'lucide-react';

interface AuthorHomePageProps {
  params: Promise<{
    authorSlug: string;
  }>;
}

export default async function AuthorHomePage({ params }: AuthorHomePageProps) {
  const { authorSlug } = await params;

  const mdFilePath = path.join(
    process.cwd(),
    'content',
    'pages',
    'about',
    `${authorSlug}.md`
  );

  let mdContent: React.ReactNode = null;
  let pageTitle = '';

  if (fs.existsSync(mdFilePath)) {
    const fileSource = fs.readFileSync(mdFilePath, 'utf8');
    try {
      const { content, frontmatter } = await compileMDX<{ title?: string }>({
        source: fileSource,
        options: { parseFrontmatter: true },
        components: {
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl md:text-4xl font-black mb-4 mt-6 text-slate-900" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl md:text-3xl font-bold mb-3 mt-5 text-slate-900" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-xl md:text-2xl" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-xl md:text-2xl" {...props} />
          ),

        },
      });

      mdContent = content;
      if (frontmatter && frontmatter.title) {
        pageTitle = frontmatter.title;
      }
    } catch (err) {
      console.error('MD parsing error:', err);
      mdContent = (
        <div className="text-sm text-red-500">
          পরিচিতি কন্টেন্ট লোড করার সময় সমস্যা হয়েছে।
        </div>
      );
    }
  } else {
    mdContent = (
      <div className="text-sm text-slate-500 italic py-4">
        {authorSlug} সংক্রান্ত কোনো কন্টেন্ট ফাইল পাওয়া যায়নি।
      </div>
    );
  }

  const siteName = pageTitle || (authorSlug ? authorSlug.charAt(0).toUpperCase() + authorSlug.slice(1) : '');

  return (
    <div className="max-w-full mx-auto px-4 py-6 font-tarunima">
      <section
        aria-labelledby="welcome-heading"
        className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* 🌟 ১. সবার উপরে ওয়েলকাম ব্যানার */}
        <div className="flex justify-center pt-2 md:pt-6">
          <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
            <Sparkles size={28} className="shrink-0" />
            <h1 id="welcome-heading" className="text-xl md:text-3xl font-tarunima p-3 font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">{siteName}তে</span> <span className="text-[#cc7a00]"> স্বাগতম</span>!
            </h1>
          </div>
        </div>

        <div className="w-full text-slate-800 leading-relaxed">
          {/* 🖼️ ২. ছবি: মোবাইলে ফুল-উইডথ (aspect ratio 2/3), বড় স্ক্রিনে বামে ফ্লোট */}
          <div className="w-full aspect-2/3 mb-6 md:float-left md:mr-6 md:mb-4 md:w-64 md:h-100 relative bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <Image
              src={`/authors/${authorSlug}.webp`}
              alt={siteName ? `${siteName}-এর ছবি` : 'লেখকের ছবি'}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              priority
              className="object-cover"
            />
          </div>

          {/* 📄 ৩. MD কন্টেন্ট: রেন্ডার করা টেক্সট সেকশন */}
          <div className="space-y-4 text-xl md:text-2xl leading-relaxed">
            {mdContent}
          </div>
        </div>
      </section>
    </div>
  );
}