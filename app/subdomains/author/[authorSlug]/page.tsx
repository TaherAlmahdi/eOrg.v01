// app/subdomains/author/[authorSlug]/page.tsx

interface Props {
  params: Promise<{ authorSlug: string }>;
}

export default async function AuthorPage({ params }: Props) {
  const { authorSlug } = await params;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 capitalize text-slate-800">
        লেখক প্রোফাইল: {authorSlug}
      </h1>
      <p className="text-slate-600">
        এই সাবডোমেনে শুধুমাত্র {authorSlug}-এর বই ও সাহিত্যকর্মগুলো শো করবে।
      </p>
    </div>
  );
}