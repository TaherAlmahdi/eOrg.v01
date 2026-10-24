import Breadcrumb from '@/app/components/Breadcrumb';
import type { Metadata } from 'next';
import AuthorList from '@/app/components/AuthorList';
import { buildTabTitle } from '@/app/lib/get-site-data';

// সব লেখকের নাম, /authors পাতার মতোই একই উৎস থেকে; প্রতিটি নাম /bio/<স্লাগ> (জীবনী) পাতায় যায়
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: buildTabTitle({
      currentPageTitle: 'লেখক জীবনী',
      siteName: 'এডুলিচার',
    }),
  };
}

export default async function BioListPage() {
  return (
    <main className="bg-[#fdfcf8] min-h-screen">
      <Breadcrumb items={[{ label: 'লেখক জীবনী' }]} />

      <div className="max-w-full mx-auto py-4 px-4">
        <AuthorList sortBy="alphabetical" />
      </div>
    </main>
  );
}
