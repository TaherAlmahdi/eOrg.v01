import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { ITEM_REGISTRY, getItemSlug } from '@/app/lib/content/core/registry/items';
import ItemView from '@/app/components/ItemView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 🔹 ডায়নামিক ট্যাব টাইটেল (Metadata)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // ১. স্লাগ ডিকোড ও রেজিস্ট্রি থেকে বাংলা নাম বের করা
  const rawSlug = decodeURIComponent(slug).trim();
  const targetSlug = getItemSlug(rawSlug);
  const targetBengaliItem = ITEM_REGISTRY[targetSlug]?.name || rawSlug;

  // ২. হোস্ট থেকে ডায়নামিক সাইটের নাম বের করা
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);
  const siteName = siteData?.title || 'এডুলিচার';

  // ❀ সেপারেটর ব্যবহার করে ৩ স্তরের ফুল টাইটেল গঠন
  const pageTitle = `${targetBengaliItem} ❀ গ্রন্থাগার ❀ ${siteName}`;

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

export default async function ItemPage({ params }: PageProps) {
  const { slug } = await params;

  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  return <ItemView slug={slug} authorSlug={siteData?.subdomain} />;
}