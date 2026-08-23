import { Metadata } from 'next';
import { headers } from 'next/headers';
import ItemList from '@/app/components/ItemList'; // 🔹 আপনার কাঙ্ক্ষিত ItemList কম্পোনেন্ট ইমপোর্ট করা হলো

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const headerSubdomain = headersList.get('x-subdomain');

  let siteName = 'এডুলিচার';
  if (host.includes('library.eduliture.org') || host.includes('library.') || headerSubdomain === 'library') {
    siteName = 'এডুলিচার পাঠশালা';
  }

  const currentPageTitle = 'প্রকরণ সম্ভার';
  // 🔹 পাইপ (|) চিহ্নের পরিবর্তে সরাসরি ' ❀ ' সেপারেটর ব্যবহার করা হলো
  const dynamicMetaTitle = `${currentPageTitle} ❀ ${siteName}`;

  return {
    title: dynamicMetaTitle,
    description: 'প্রকরণসমূহের তালিকা',
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