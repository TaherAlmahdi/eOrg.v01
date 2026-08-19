// app/items/page.tsx
import ItemListView, { getRealItemsList } from "@/app/components/ItemListView";

export default async function ItemsPage() {
  // ফাইল সিস্টেম (.md/mdx) স্ক্যান করে সরাসরি ডাটা ফেচ করা হচ্ছে
  const realItems = await getRealItemsList();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-teal-800 font-tarunima">
        সকল আইটেম
      </h1>
      <ItemListView items={realItems} isHomePage={false} />
    </main>
  );
}