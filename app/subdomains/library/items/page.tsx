import { Metadata } from 'next';
import { headers } from 'next/headers';
import ItemList from '@/app/components/ItemList'; // 🔹 আপনার কাঙ্ক্ষিত ItemList কম্পোনেন্ট ইমপোর্ট করা হলো
import { buildTabTitle } from '@/app/lib/get-site-data';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const headerSubdomain = headersList.get('x-subdomain');

  let siteName = 'এডুলিচার';
  if (host.includes('library.eduliture.org') || host.includes('library.') || headerSubdomain === 'library') {
    siteName = 'এডুলিচার পাঠশালা ফিড';
  }

  const dynamicMetaTitle = buildTabTitle({
    currentPageTitle: 'সকল আইটেম',
    siteName: siteName,
  });

  return {
    title: dynamicMetaTitle,
    description: 'সকল আইটেম ও প্রকরণের তালিকা',
  };
}

export default async function AllItemsPage() {
  return (
    <div className="py-0">
      {/* 🔹 সরাসরি ItemList কম্পোনেন্ট রেন্ডার করা হলো */}
      <ItemList />
    </div>
  );
}