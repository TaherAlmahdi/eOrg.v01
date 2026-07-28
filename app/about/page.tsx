import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Metadata } from 'next';
import { getSubdomainData } from '@/app/lib/get-site-data';
import Header from '@/app/components/Header'; // আপনার প্রজেক্টের হেডার কম্পোনেন্টের পাথ

interface AboutData {
  title?: string;
  contentHtml: string;
}

// 📂 এমডি ফাইল থেকে তথ্য পড়ার ফাংশন
async function getAboutData(subdomain: string): Promise<AboutData> {
  const dirPath = path.join(process.cwd(), 'content', 'pages', 'about');
  let filePath = path.join(dirPath, `${subdomain}.md`);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(dirPath, 'www.md');
  }

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Frontmatter আলাদা করা হচ্ছে
    const { data, content } = matter(fileContents);
    
    // Markdown থেকে HTML কনভার্ট
    const processedContent = await remark()
      .use(html)
      .process(content);

    return {
      title: data.title,
      contentHtml: processedContent.toString(),
    };
  } catch (error) {
    return {
      title: 'আমাদের সম্পর্কে',
      contentHtml: '<p>আমাদের সম্পর্কে কোনো তথ্য পাওয়া যায়নি।</p>',
    };
  }
}

// 🏷️ ডাইনামিক ব্রাউজার ট্যাব টাইটেল
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  
  const siteData = getSubdomainData(host);
  const subdomain = siteData.subdomain || 'www';

  const aboutData = await getAboutData(subdomain);

  const pageTitle = aboutData.title || 'আমাদের সম্পর্কে';
  const siteName = siteData.title || 'এডুলিচার';

  return {
    // এমডি ফাইলের টাইটেল | সাইট টাইটেল
    title: `${pageTitle} | ${siteName}`,
  };
}

// 📖 মূল পেজ কম্পোনেন্ট
export default async function AboutPage() {
  const headersList = await headers();
  const host = headersList.get('host');
  
  const siteData = getSubdomainData(host);
  const subdomain = siteData.subdomain || 'www';

  const aboutData = await getAboutData(subdomain);

  return (
    <>
      {/* ১. স্বাভাবিক হেডার কম্পোনেন্ট */}
      <Header />

      {/* ২. এমডি ফাইলের কন্টেন্ট রেন্ডার */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article 
          className="prose lg:prose-xl max-w-none font-tarunima"
          dangerouslySetInnerHTML={{ __html: aboutData.contentHtml }} 
        />
      </main>
    </>
  );
}