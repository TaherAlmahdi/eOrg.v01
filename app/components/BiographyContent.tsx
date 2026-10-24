import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import BioSidebar, { InfoField } from '@/app/components/BioSidebar';
import type { BioFrontmatter } from '@/app/lib/bio';

// কন্টেন্ট রেন্ডারার কম্পোনেন্ট (UI Layout Component) — /biography ও /bio/[slug] দুই পাতাতেই ব্যবহৃত
export default function BiographyContent({
  frontmatter,
  content,
}: {
  frontmatter: BioFrontmatter;
  content: string;
}) {
  const birthInfo = frontmatter.birth_date
    ? `${frontmatter.birth_date}${frontmatter.birth_place ? ` (${frontmatter.birth_place})` : ''}`
    : undefined;

  const deathInfo = frontmatter.death_date
    ? `${frontmatter.death_date}${frontmatter.death_place ? ` (${frontmatter.death_place})` : ''}`
    : undefined;

  const websiteValue = frontmatter.website ? (
    <a
      href={
        frontmatter.website.startsWith('http')
          ? frontmatter.website
          : `https://${frontmatter.website}`
      }
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

  const infoFields = rawFields.filter((item) => Boolean(item.value));

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
