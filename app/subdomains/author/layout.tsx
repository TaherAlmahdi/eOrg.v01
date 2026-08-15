import React from 'react';
import { Metadata } from 'next';
import { getAuthorSlugFromTitle, getSlug } from '@/app/lib/content/core/registry';

interface Props {
  children: React.ReactNode;
  params: Promise<Record<string, string | undefined>>;
}

// 🏷️ Dynamic OG & Metadata Generator
export async function generateMetadata({ params }: { params: Promise<Record<string, string | undefined>> }): Promise<Metadata> {
  const resolvedParams = await params;
  const authorParam = resolvedParams?.author || resolvedParams?.slug || '';
  
  // ইউআরএল বা নাম থেকে রিডেবল লেখকের নাম ফরম্যাট করা
  const decodedAuthor = decodeURIComponent(authorParam).replace(/-/g, ' ');
  const authorName = decodedAuthor ? decodedAuthor.charAt(0).toUpperCase() + decodedAuthor.slice(1) : 'লেখক';

  const title = `${authorName} ❀ এডুলিচার`;
  const description = `${authorName}-এর জীবনী, সাহিত্যকর্ম, প্রকাশিত বই ও রচনা সংগ্রহ পড়ুন এডুলিচারে।`;
  const ogImageUrl = `https://eduliture.org/api/og?title=${encodeURIComponent(authorName)}&tagline=${encodeURIComponent('লেখক পরিচিতি ও সাহিত্যকর্ম')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://eduliture.org/author/${encodeURIComponent(authorParam)}`,
      siteName: 'এডুলিচার',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${authorName} - এডুলিচার`,
        },
      ],
      locale: 'bn_BD',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function AuthorLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <main className="grow">{children}</main>
    </div>
  );
}