import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import BioSidebar, { InfoField } from '@/app/components/BioSidebar';
import Breadcrumb, { type Crumb } from '@/app/components/Breadcrumb';
import type { BioExtraField, BioFrontmatter, BioWebsite } from '@/app/lib/bio';

const LINK_CLASS = 'text-teal-600 dark:text-teal-400 hover:underline wrap-break-words';

function externalLink(text: string, address: string) {
  return (
    <a
      href={address.startsWith('http') ? address : `https://${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {text}
    </a>
  );
}

/** Joins several nodes with line breaks (one per line); a single node is returned as is. */
function stackLines(nodes: React.ReactNode[]): React.ReactNode {
  if (nodes.length === 0) return undefined;
  if (nodes.length === 1) return nodes[0];
  return nodes.map((node, index) => (
    <React.Fragment key={index}>
      {index > 0 && <br />}
      {node}
    </React.Fragment>
  ));
}

/** `website` may be a plain address, one { name, link } or a list of them. */
function websiteNode(frontmatter: BioFrontmatter): React.ReactNode {
  const { website, website_name } = frontmatter;
  if (!website) return undefined;

  const entries: BioWebsite[] = (Array.isArray(website) ? website : [website]).map((entry) =>
    typeof entry === 'string' ? { name: website_name, link: entry } : entry
  );

  return stackLines(
    entries
      .filter((entry) => entry && typeof entry.link === 'string' && entry.link)
      .map((entry) => externalLink(entry.name || entry.link, entry.link))
  );
}

/** Rows from the frontmatter `fields:` list — any label/value can be added without touching the code. */
function extraFields(frontmatter: BioFrontmatter): InfoField[] {
  if (!Array.isArray(frontmatter.fields)) return [];

  return frontmatter.fields
    .filter((field: BioExtraField) => field && field.label && field.value)
    .map((field) => {
      const values = (Array.isArray(field.value) ? field.value : [field.value]).map(String);
      if (field.type === 'image') return { label: field.label, value: values[0], type: 'image' };
      return {
        label: field.label,
        value: stackLines(
          values.map((text) => (field.link ? externalLink(text, field.link) : text))
        ),
      };
    });
}

// কন্টেন্ট রেন্ডারার কম্পোনেন্ট (UI Layout Component) — /biography ও /bio/[slug] দুই পাতাতেই ব্যবহৃত
export default function BiographyContent({
  frontmatter,
  content,
  parentCrumbs = [],
}: {
  frontmatter: BioFrontmatter;
  content: string;
  /** Breadcrumb steps before the current page (the current page is always added last). */
  parentCrumbs?: Crumb[];
}) {
  const birthInfo = frontmatter.birth_date
    ? `${frontmatter.birth_date}${frontmatter.birth_place ? ` (${frontmatter.birth_place})` : ''}`
    : undefined;

  const deathInfo = frontmatter.death_date
    ? `${frontmatter.death_date}${frontmatter.death_place ? ` (${frontmatter.death_place})` : ''}`
    : undefined;

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
    { label: 'ওয়েবসাইট', value: websiteNode(frontmatter) },
    ...extraFields(frontmatter),
  ];

  const infoFields = rawFields.filter((item) => Boolean(item.value));
  const pageTitle = frontmatter.title || frontmatter.name;

  return (
    <>
      <Breadcrumb items={[...parentCrumbs, { label: pageTitle || 'জীবনী' }]} />

      <main className="max-w-full mx-auto px-2 py-4">
        {/* Mobile: title, then the image/info card, then the text. Desktop: full-width title, then the card (left) and text (right) starting on the same line. */}
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:gap-x-6">
          <BioSidebar
            className="order-2 md:order-none md:col-start-1 md:row-start-2"
            image={frontmatter.image}
            name={frontmatter.name}
            infoFields={infoFields}
          />

          <h1 className="order-1 md:order-none md:col-span-2 md:row-start-1 title mb-7 border-b border-slate-200 dark:border-slate-700 pb-3 font-tarunima text-gray-900 dark:text-gray-100">
            {pageTitle}
          </h1>

          <div className="order-3 md:order-none md:col-start-2 md:row-start-2 prose prose-base dark:prose-invert max-w-none font-tarunima leading-relaxed text-gray-800 dark:text-gray-200">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </>
  );
}
