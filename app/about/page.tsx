import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { Metadata } from 'next';
import { getSubdomainData, buildTabTitle } from '@/app/lib/get-site-data';
import TOCAbout, { TocItem } from '@/app/components/TOCAbout';

interface AboutFrontmatter {
  title?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  [key: string]: any;
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

function getAboutData(subdomain: string): AboutData {
  const dirPath = path.join(process.cwd(), 'content', 'pages', 'about');
  let filePath = path.join(dirPath, `${subdomain.toLowerCase()}.md`);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(dirPath, 'www.md');
  }

  try {
    if (!fs.existsSync(filePath)) {
      return {
        frontmatter: { title: 'আমাদের সম্পর্কে' },
        content: 'আমাদের সম্পর্কে কোনো তথ্য পাওয়া যায়নি।',
      };
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      frontmatter: data as AboutFrontmatter,
      content: content,
    };
  } catch (error) {
    return {
      frontmatter: { title: 'আমাদের সম্পর্কে' },
      content: 'তথ্য লোড করতে সমস্যা হয়েছে।',
    };
  }
}

function extractToc(markdownContent: string): TocItem[] {
  // ১. মার্কডাউন (যেমন: ## Title) এবং ২. HTML ট্যাগ (যেমন: <h2 class="...">Title</h2>) উভয়ই ম্যাচ করবে
  const combinedRegex = /^(#{1,6})\s+(.+)$|<h([1-6])(?:\s+[^>]*)?>(.*?)<\/h\3>/gim;
  
  const toc: TocItem[] = [];
  const slugTracker: Record<string, number> = {};
  let match;

  while ((match = combinedRegex.exec(markdownContent)) !== null) {
    let level: number;
    let rawText: string;

    if (match[1]) {
      // Markdown matching
      level = match[1].length;
      rawText = match[2];
    } else {
      // HTML Tag matching (<h1-6>)
      level = parseInt(match[3], 10);
      rawText = match[4];
    }

    // টেক্সট থেকে HTML ও Markdown ফরম্যাটিং স্ট্রিপ করা
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

  const { frontmatter } = getAboutData(subdomain);

  const currentPageTitle = frontmatter.title || 'আমাদের সম্পর্কে';

  const dynamicMetaTitle = buildTabTitle({
    metaTitle: frontmatter.meta_title,
    currentPageTitle: currentPageTitle,
    siteName: siteData.title,
  });

  const description =
    frontmatter.meta_description ||
    `${siteData.title || 'এডুলিচার'}-এর 'আমাদের সম্পর্কে' পেজ।`;

  const shareImage = frontmatter.og_image || siteData.ogImage;

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

export default async function AboutPage() {
  const subdomain = await getOnlySubdomain();
  const aboutData = getAboutData(subdomain);
  const tocItems = extractToc(aboutData.content);

  return (
    <main className="w-full px-4 py-8">
      {/* 
        ১. w-full দিয়ে পুরো স্ক্রিন বা কন্টেইনার ফুল-ওয়াইড করা হয়েছে।
        ২. items-start বজায় রাখায় স্টিকি পজিশনিং কাজ করবে।
      */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        
        {/* ডাইনামিক উইডথের বামপাশের সাইডবার */}
        <TOCAbout items={tocItems} />

        {/* ডানপাশের মূল কন্টেন্ট (অবশিষ্ট সম্পূর্ণ জায়গা নিয়ে থাকবে) */}
        <article className="flex-1 w-full min-w-0 prose lg:prose-xl font-tarunima text-gray-900 dark:text-gray-100 max-w-none">
          <h1 className="title mb-6 border-b pb-3 font-tarunima">
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