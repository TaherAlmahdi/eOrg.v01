import { Metadata } from 'next';
import { headers } from 'next/headers';
import ItemView from '@/app/components/ItemView';
import { ITEM_REGISTRY, getItemSlug } from '@/app/lib/content/core/registry/items';
import { buildTabTitle } from '@/app/lib/get-site-data';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ subdomain?: string }>;
}

// 🔹 ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slugs = resolvedParams?.slug || [];
  let displayTitle = 'সকল আইটেম';

  if (slugs.length > 0) {
    const rawSlug = decodeURIComponent(slugs[slugs.length - 1]).trim();
    const registeredSlug = getItemSlug(rawSlug);
    const targetSlug = registeredSlug || rawSlug;
    displayTitle = ITEM_REGISTRY[targetSlug]?.name || rawSlug;
  }

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const headerSubdomain = headersList.get('x-subdomain');

  const subdomain = resolvedSearchParams?.subdomain || headerSubdomain;
  const authorSlug = (subdomain && subdomain !== 'library' ? subdomain : undefined);

  let siteName = 'এডুলিচার';

  if (host.includes('library.eduliture.org') || host.includes('library.') || subdomain === 'library') {
    siteName = 'এডুলিচার পাঠশালা ফিড';
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
    description: slugs.length === 0 ? 'সকল আইটেম ও প্রকরণের তালিকা' : `${displayTitle}`,
  };
}

export default async function ItemsCatchAllPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugs = resolvedParams?.slug || [];

  // ১. যদি ইউআরএল কেবল /items হয় (কোনো স্লাগ নেই, slugs.length === 0)
  if (slugs.length === 0) {
    return (
      <div className="py-0">
        <ItemView slug="" slugsArray={[]} />
      </div>
    );
  }

  // ২. নির্দিষ্ট প্রকরণ বা আইটেম স্লাগ/টাইটেল প্রসেসিং
  const rawSlug = decodeURIComponent(slugs[slugs.length - 1]).trim();
  const registeredSlug = getItemSlug(rawSlug);
  const finalSlug = registeredSlug || rawSlug;

  return (
    <div className="py-0">
      <ItemView slug={finalSlug} slugsArray={slugs} />
    </div>
  );
}