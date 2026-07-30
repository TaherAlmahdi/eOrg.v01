import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getGenreTitle } from '@/app/lib/content/core/registry';
import GenreView from '@/app/components/GenreView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 🔹 ডায়নামিক ট্যাব টাইটেল
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).toLowerCase();

  // ১. রেজিস্ট্রি থেকে বাংলা জনরার নাম বের করা (যেমন: novel -> উপন্যাস)
  const targetBengaliGenre = getGenreTitle(decodedSlug) || slug;

  // ২. হোস্ট থেকে ডায়নামিক সাইটের নাম বের করা
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  // ❀ সেপারেটর ব্যবহার করে ৩ স্তরের ফুল টাইটেল গঠন
  const pageTitle = `${targetBengaliGenre} ❀ গ্রন্থাগার ❀ ${siteName}`;

  return {
    title: pageTitle,
    openGraph: {
      title: pageTitle,
    },
    twitter: {
      title: pageTitle,
    },
  };
}

export default async function GenrePage({ params }: PageProps) {
  const { slug } = await params;

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  return <GenreView slug={slug} authorSlug={siteData.subdomain} />;
}