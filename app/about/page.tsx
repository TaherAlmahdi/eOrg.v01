// app/about/page.tsx
import { headers } from 'next/headers';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Metadata } from 'next';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import { readTextFromR2 } from '@/app/lib/books/r2';
import TOCAbout, { TocItem } from '@/app/components/TOCAbout';

interface AboutFrontmatter {
  title?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  [key: string]: unknown;
}

interface AboutData {
  frontmatter: AboutFrontmatter;
  content: string;
}

async function getOnlySubdomain(): Promise<string> {
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

  return 'www';
}

// 🔹 R2 থেকে (content/pages/about/{subdomain}.md → pages/about/{subdomain}.md) ডাটা রিড করার ফাংশন
async function getAboutData(subdomain: string): Promise<AboutData> {
  const primaryKey = `pages/about/${subdomain.toLowerCase()}.md`;
  const fallbackKey = 'pages/about/www.md';

  try {
    let raw = await readTextFromR2(primaryKey);
    if (raw === null) {
      raw = await readTextFromR2(fallbackKey);
    }

    if (raw === null) {
      return {
        frontmatter: { title: 'আমাদের সম্পর্কে' },
        content: 'আমাদের সম্পর্কে কোনো তথ্য পাওয়া যায়নি।',
      };
    }

    const { data, content } = matter(raw);

    return {
      frontmatter: data as AboutFrontmatter,
      content,
    };
  } catch {
    return {
      frontmatter: { title: 'আমাদের সম্পর্কে' },
      content: 'তথ্য লোড করতে সমস্যা হয়েছে।',
    };
  }
}

function extractToc(markdownContent: string): TocItem[] {
  // মার্কডাউন (যেমন: ## Title) এবং HTML ট্যাগ (যেমন: <h2>Title</h2>) উভয়ই ম্যাচ করবে
  const combinedRegex = /^(#{1,6})\s+(.+)$|<h([1-6])(?:\s+[^>]*)?>(.*?)<\/h\3>/gim;

  const toc: TocItem[] = [];
  const slugTracker: Record<string, number> = {};
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(markdownContent)) !== null) {
    let level: number;
    let rawText: string;

    if (match[1]) {
      // Markdown
      level = match[1].length;
      rawText = match[2];
    } else {
      // HTML Tag
      level = parseInt(match[3], 10);
      rawText = match[4];
    }

    // HTML ও Markdown ফরম্যাটিং স্ট্রিপ
    const cleanText = rawText
      .replace(/<[^>]*>/g, '')
      .replace(/[*_~`]/g, '')
      .trim();

    if (!cleanText) continue;

    let baseSlug = cleanText
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF\s-]/g, '')
      .replace(/\s+/g, '-');

    if (!baseSlug) baseSlug = 'heading';

    let uniqueId = baseSlug;
    if (slugTracker[baseSlug] !== undefined) {
      slugTracker[baseSlug] += 1;
      uniqueId = `${baseSlug}-${slugTracker[baseSlug]}`;
    } else {
      slugTracker[baseSlug] = 0;
    }

    toc.push({ id: uniqueId, text: cleanText, level });
  }

  return toc;
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');

  const siteData = getSubdomainData(host);
  const subdomain = await getOnlySubdomain();

  const { frontmatter } = await getAboutData(subdomain);

  const currentPageTitle = frontmatter.title || 'আমাদের সম্পর্কে';

  const dynamicMetaTitle = buildTabTitle({
    metaTitle: frontmatter.meta_title,
    currentPageTitle,
    siteName: siteData.title,
  });

  const description =
    frontmatter.meta_description ||
    `${siteData.title}-এর 'আমাদের সম্পর্কে' পেজ।`;

  const shareImage = frontmatter.og_image || siteData.ogImage;

  return {
    title: dynamicMetaTitle,
    description,
    openGraph: {
      title: dynamicMetaTitle,
      description,
      images: shareImage ? [{ url: shareImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicMetaTitle,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export default async function AboutPage() {
  const subdomain = await getOnlySubdomain();
  const aboutData = await getAboutData(subdomain);
  const tocItems = extractToc(aboutData.content);

  return (
    <main className="w-full px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        {/* টেবিল অফ কন্টেন্টস সাইডবার */}
        <TOCAbout items={tocItems} />

        {/* মূল আর্টিকেলের কন্টেন্ট */}
        <article className="flex-1 w-full min-w-0 font-tarunima text-gray-900 dark:text-gray-100 max-w-none">
          <h1 className="title mb-6 border-b pb-3 text-3xl font-bold font-tarunima">
            {aboutData.frontmatter.title || 'আমাদের সম্পর্কে'}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none font-tarunima leading-relaxed text-gray-800 dark:text-gray-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSlug]}
            >
              {aboutData.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
  );
}