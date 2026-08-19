// app/items/[itemSlug]/[title]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getItemByParams } from '@/app/lib/books';

interface PageProps {
  params: Promise<{
    itemSlug: string;
    title: string;
  }>;
}

export default async function SingleItemContentPage({ params }: PageProps) {
  const { itemSlug, title } = await params;

  const data = await getItemByParams(itemSlug, title);

  if (!data) {
    notFound();
  }

  const { item, navigation } = data;

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      {/* মেটা ট্র্যাকিং */}
      <div className="text-sm text-gray-500 mb-4 flex gap-2 items-center">
        <Link href={`/items/${item.itemTypeSlug}`} className="capitalize font-medium hover:underline text-blue-600">
          {item.itemType}
        </Link>
        <span>•</span>
        <span>{item.author}</span>
        <span>•</span>
        <Link href={`/book/${item.bookSlug}`} className="hover:underline">
          {item.bookTitle}
        </Link>
      </div>

      {/* টাইটেল */}
      <h1 className="text-4xl font-bold mb-6 text-gray-900">{item.title}</h1>

      {/* কনটেন্ট */}
      <div className="prose prose-lg max-w-none mb-12 text-gray-800 leading-relaxed">
        {item.content}
      </div>

      {/* নেক্সট ও প্রিভিয়াস আইটেম নেভিগেশন */}
      <div className="border-t pt-6 mt-8 flex justify-between items-center gap-4">
        {navigation.prev ? (
          <Link
            href={navigation.prev.href}
            className="flex flex-col text-left group p-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <span className="text-xs text-gray-400 font-medium">← পূর্ববর্তী আইটেম</span>
            <span className="text-sm font-semibold text-blue-600 group-hover:underline">
              {navigation.prev.title}
            </span>
          </Link>
        ) : <div />}

        {navigation.next ? (
          <Link
            href={navigation.next.href}
            className="flex flex-col text-right group p-3 rounded-lg border hover:bg-gray-50 transition"
          >
            <span className="text-xs text-gray-400 font-medium">পরবর্তী আইটেম →</span>
            <span className="text-sm font-semibold text-blue-600 group-hover:underline">
              {navigation.next.title}
            </span>
          </Link>
        ) : <div />}
      </div>
    </article>
  );
}