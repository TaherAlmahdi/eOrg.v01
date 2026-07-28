import React from 'react';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Metadata } from 'next';
import BioSidebar, { InfoField } from '@/app/components/BioSidebar';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';

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
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  [key: string]: any;
}

// ১. সাবডোমেন বের করার হেল্পার
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

// ২. লোকাল ফাইল থেকে বায়োগ্রাফি ডাটা লোড করা
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

// ৩. 🏷️ Dynamic Metadata Export
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const subdomain = await getOnlySubdomain();
  const bioData = getBioData(subdomain);

  if (!bioData) {
    return {
      title: 'জীবনী খুঁজে পাওয়া যায়নি',
    };
  }

  const { frontmatter } = bioData;
  const currentPageTitle = frontmatter.title || frontmatter.name || 'জীবনী';

  // 💡 buildTabTitle দিয়ে প্রথম কোডের মতো টাইটেল জেনারেট করা হচ্ছে
  const dynamicMetaTitle = buildTabTitle({
    metaTitle: frontmatter.meta_title,
    currentPageTitle: currentPageTitle,
    siteName: siteData.title,
  });

  const description = frontmatter.meta_description || `${currentPageTitle}-এর জীবনী ও সংক্ষিপ্ত পরিচিতি।`;
  const shareImage = frontmatter.og_image || frontmatter.image || siteData.ogImage;

  return {
    title: dynamicMetaTitle,
    description: description,
    openGraph: {
      title: dynamicMetaTitle,
      description: description,
      images: shareImage ? [{ url: shareImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicMetaTitle,
      description: description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

// ৪. কন্টেন্ট রেন্ডারার কম্পোনেন্ট (UI Layout Component)
function BiographyContent({ 
  frontmatter, 
  content 
}: { 
  frontmatter: BioFrontmatter; 
  content: string 
}) {
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
        <h1 className="title mb-6 border-b pb-3 font-tarunima text-gray-900 dark:text-gray-100">
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

// ৫. মেইন পেজ কম্পোনেন্ট (Server Page Controller)
export default async function BiographyPage() {
  const subdomain = await getOnlySubdomain();

  if (!subdomain) {
    notFound();
  }

  const bioData = getBioData(subdomain);

  if (!bioData) {
    notFound();
  }

  return (
    <BiographyContent 
      frontmatter={bioData.frontmatter} 
      content={bioData.content} 
    />
  );
}