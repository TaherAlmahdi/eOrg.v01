import { Metadata } from 'next';
import { headers } from 'next/headers';
import ItemView from '@/app/components/ItemView';
import { ITEM_REGISTRY, getItemSlug } from '@/app/lib/content/core/registry/items';
import { buildTabTitle } from '@/app/lib/get-site-data';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subdomain?: string }>;
}

// 🔹 ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawSlug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug).trim() : '';
  const targetSlug = getItemSlug(rawSlug);
  const displayTitle = ITEM_REGISTRY[targetSlug]?.name || rawSlug || 'তালিকা';

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const headerSubdomain = headersList.get('x-subdomain');

  const subdomain = resolvedSearchParams?.subdomain || headerSubdomain;
  // যদি রাউট বা প্যারাম থেকে authorSlug পাওয়া না যায়, সাবডোমেন চেক করা হচ্ছে
  const authorSlug = (subdomain && subdomain !== 'library' ? subdomain : undefined);

  // সাবডোমেন বা হোস্টনেম অনুযায়ী সাইটের নাম ঠিক করার লজিক
  let siteName = 'এডুলিচার';

  if (host.includes('library.eduliture.org') || host.includes('library.') || subdomain === 'library') {
    siteName = 'এডুলিচার পাঠশালা';
  } else if (host.includes('nazrul.eduliture.org') || host.includes('nazrul.') || authorSlug === 'nazrul') {
    siteName = 'নজরুল রচনাবলী';
  } else if (authorSlug) {
    siteName = `${authorSlug} রচনাবলী`;
  }

  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: displayTitle,
    siteName: siteName,
  });

  return {
    title: dynamicMetaTitle,
    description: `${displayTitle}`,
  };
}

export default async function ItemTypePage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug).trim() : '';

  return (
    <div className="py-0">
      <ItemView slug={slug} />
    </div>
  );
}