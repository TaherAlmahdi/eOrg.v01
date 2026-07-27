// app/biography/page.tsx

import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import BioSidebar from '@/app/components/BioSidebar'; // পথ আপনার অনুযায়ী ঠিক করে নিন

interface BioFrontmatter {
  title?: string;
  name?: string;
  image?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  occupation?: string;
  nationality?: string;
  notable_works?: string;
  [key: string]: any;
}

// সাবডোমেন বের করার ফাংশন
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

// ফাইল রিড করার ফাংশন
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

  if (!bioData) return { title: 'জীবনী' };

  return {
    title: `${bioData.frontmatter.name || bioData.frontmatter.title || 'জীবনী'} - জীবনী`,
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

  const infoFields = [
    { label: 'নাম', value: frontmatter.name },
    { label: 'জন্ম', value: frontmatter.birth_date },
    { label: 'জন্মস্থান', value: frontmatter.birth_place },
    { label: 'মৃত্যু', value: frontmatter.death_date },
    { label: 'মৃত্যুস্থান', value: frontmatter.death_place },
    { label: 'পেশা', value: frontmatter.occupation },
    { label: 'জাতীয়তা', value: frontmatter.nationality },
    { label: 'উল্লেখযোগ্য কাজ', value: frontmatter.notable_works },
  ].filter((item) => item.value && typeof item.value === 'string');

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <BioSidebar
        image={frontmatter.image}
        name={frontmatter.name}
        infoFields={infoFields as { label: string; value: string }[]}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-6 border-b pb-3 font-tarunima">
          {frontmatter.title || frontmatter.name}
        </h1>

        <div className="prose prose-lg max-w-none space-y-4 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line font-tarunima">
          {content}
        </div>
      </BioSidebar>
    </main>
  );
}