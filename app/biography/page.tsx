// app/biography/page.tsx

import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import BioSidebar, { InfoField } from '@/app/components/BioSidebar';

interface BioFrontmatter {
  title?: string;
  name?: string;
  real_name?: string;
  image?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  pseudonym?: string;
  occupation?: string;
  nationality?: string;
  citizenship?: string;
  genre?: string;
  notable_works?: string;
  awards?: string;
  spouse?: string;
  children?: string;
  relatives?: string;
  signature?: string;
  website?: string;
  website_name?: string;
  [key: string]: any;
}

async function getOnlySubdomain(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  const hostWithoutPort = host.split(':')[0];
  const parts = hostWithoutPort.split('.');

  if (parts.length > 1) {
    const firstPart = parts[0].toLowerCase();
    if (firstPart !== 'www' && firstPart !== 'localhost') {
      return firstPart;
    }
  }
  
  return null; 
}

function getBioData(subdomain: string | null) {
  if (!subdomain) return null;

  const targetDir = path.join(process.cwd(), 'content', 'pages', 'bio');
  const filePath = path.join(targetDir, `${subdomain.toLowerCase()}.md`);

  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContents);

  return {
    frontmatter: data as BioFrontmatter,
    content,
  };
}

export async function generateMetadata() {
  const subdomain = await getOnlySubdomain();
  const bioData = getBioData(subdomain);

  const mainSiteTitle = "এডুলিটেরেচার"; // আপনার মেইন সাইটের নাম
  const pageTitle = bioData?.frontmatter.title || bioData?.frontmatter.name || 'জীবনী';
  
  // সাবডোমেন থেকে সাইটের নাম সুন্দর করে তৈরি করা (যেমন: bankim -> ব্যাংকিম)
  const siteTitle = subdomain 
    ? bioData?.frontmatter.name || subdomain.charAt(0).toUpperCase() + subdomain.slice(1) 
    : 'জীবনী';

  return {
    title: `${pageTitle} | ${siteTitle} | ${mainSiteTitle}`,
  };
}

export default async function BiographyPage() {
  const subdomain = await getOnlySubdomain();

  if (!subdomain) {
    notFound();
  }

  const bioData = getBioData(subdomain);

  if (!bioData) {
    notFound();
  }

  const { frontmatter, content } = bioData;

  const birthInfo = frontmatter.birth_date 
    ? `${frontmatter.birth_date}${frontmatter.birth_place ? ` (${frontmatter.birth_place})` : ''}` 
    : undefined;

  const deathInfo = frontmatter.death_date 
    ? `${frontmatter.death_date}${frontmatter.death_place ? ` (${frontmatter.death_place})` : ''}` 
    : undefined;

  const websiteValue = frontmatter.website ? (
    <a 
      href={frontmatter.website.startsWith('http') ? frontmatter.website : `https://${frontmatter.website}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-teal-600 dark:text-teal-400 hover:underline wrap-break-words"
    >
      {frontmatter.website_name || frontmatter.website}
    </a>
  ) : undefined;

  const rawFields: InfoField[] = [
    { label: 'নাম', value: frontmatter.name },
    { label: 'মূল নাম', value: frontmatter.real_name },
    { label: 'ছদ্মনাম', value: frontmatter.pseudonym },
    { label: 'জন্ম', value: birthInfo },
    { label: 'মৃত্যু', value: deathInfo },
    { label: 'পেশা', value: frontmatter.occupation },
    { label: 'জাতীয়তা', value: frontmatter.nationality },
    { label: 'নাগরিকত্ব', value: frontmatter.citizenship },
    { label: 'ধরণ', value: frontmatter.genre },
    { label: 'কর্ম', value: frontmatter.notable_works },
    { label: 'পুরস্কার', value: frontmatter.awards },
    { label: 'দাম্পত্যসঙ্গী', value: frontmatter.spouse },
    { label: 'সন্তান', value: frontmatter.children },
    { label: 'আত্মীয়', value: frontmatter.relatives },
    { label: 'স্বাক্ষর', value: frontmatter.signature, type: 'image' },
    { label: 'ওয়েবসাইট', value: websiteValue },
  ];

  const infoFields = rawFields.filter(
    (item) => item.value !== undefined && item.value !== null && item.value !== ''
  );

  return (
    <main className="max-w-full mx-auto px-2 py-4">
      <BioSidebar
        image={frontmatter.image}
        name={frontmatter.name}
        infoFields={infoFields}
      >
        <h1 className="text-xl md:text-2xl font-bold mb-6 border-b pb-3 font-tarunima text-gray-900 dark:text-gray-100">
          {frontmatter.title || frontmatter.name}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none font-tarunima leading-relaxed text-gray-800 dark:text-gray-200">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </BioSidebar>
    </main>
  );
}