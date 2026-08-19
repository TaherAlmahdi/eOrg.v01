// app/items/page.tsx
import { headers } from 'next/headers';
import ItemList from '@/app/components/ItemList';

interface PageProps {
  searchParams: Promise<{ subdomain?: string }>;
  params?: Promise<{ author?: string }>;
}

export default async function ItemsPage({ searchParams, params }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = params ? await params : {};

  const headerList = await headers();
  const headerSubdomain = headerList.get('x-subdomain');

  const subdomain = resolvedSearchParams?.subdomain || headerSubdomain;
  const authorSlug = resolvedParams?.author || (subdomain && subdomain !== 'library' ? subdomain : undefined);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {authorSlug ? 'লেখকের আইটেমসমূহ' : 'সকল আইটেম'}
      </h1>
      <ItemList authorSlug={authorSlug} />
    </main>
  );
}

export async function generateMetadata({ searchParams, params }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const resolvedParams = params ? await params : {};
  
  const headerList = await headers();
  const subdomain = resolvedSearchParams?.subdomain || headerList.get('x-subdomain');
  const authorSlug = resolvedParams?.author || (subdomain && subdomain !== 'library' ? subdomain : undefined);

  return {
    title: authorSlug ? `আইটেমস - ${authorSlug}` : 'লাইব্রেরি আইটেমস',
    description: 'সকল প্রকাশিত আইটেমের তালিকা',
  };
}