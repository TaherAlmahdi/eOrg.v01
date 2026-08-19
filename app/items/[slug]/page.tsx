import { Metadata } from 'next';
import ItemView from '@/app/components/ItemView';
import { ITEM_REGISTRY, getItemSlug } from '@/app/lib/content/core/registry/items';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug).trim() : '';
  const targetSlug = getItemSlug(rawSlug);
  const displayTitle = ITEM_REGISTRY[targetSlug]?.name || rawSlug || 'তালিকা';

  return {
    title: `${displayTitle} — সাহিত্য তালিকা`,
    description: `${displayTitle} বিভাগের অধীনে প্রকাশিত সকল রচনা ও সাহিত্যকর্মের তালিকা।`,
  };
}

export default async function ItemTypePage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug).trim() : '';

  return (
    <div className="py-4">
      <ItemView slug={slug} />
    </div>
  );
}