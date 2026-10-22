import { Metadata } from 'next';
import { getAllStories, Story } from '@/lib/stories/story';
import StoriesPageClient from '@/app/components/StoryPageClient';

// ==========================================
// 🌐 Constant Configuration
// ==========================================
const SITE_NAME = 'কথামালা';

interface PageProps {
  params: Promise<{
    slug?: string;
  }>;
}

// টাইপ-সেফ স্টোরিজ ডাটা এক্সট্র্যাক্টর হেলপার
function parseStoriesData(storiesResponse: unknown): Story[] {
  if (Array.isArray(storiesResponse)) {
    return storiesResponse as Story[];
  }

  if (storiesResponse && typeof storiesResponse === 'object') {
    const res = storiesResponse as Record<string, unknown>;
    if (Array.isArray(res.stories)) {
      return res.stories as Story[];
    }
    if (Array.isArray(res.data)) {
      return res.data as Story[];
    }
  }

  return [];
}

// 🏷️ ডাইনামিক মেটাডেটা ফাংশন
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  const dynamicMetaTitle = `কথা ভাণ্ডার ❀ ${SITE_NAME}`;

  return {
    title: dynamicMetaTitle,
    alternates: { canonical: '/stories' },
    openGraph: { title: dynamicMetaTitle },
    twitter: { title: dynamicMetaTitle },
  };
}

// 📖 মেইন পেজ কম্পোনেন্ট
export const dynamic = 'force-dynamic';

export default async function StoriesPage({ params }: PageProps) {
  await params;

  const storiesResponse = await getAllStories();
  const storiesData = parseStoriesData(storiesResponse);

  return (
    <StoriesPageClient
      initialStories={storiesData}
      siteTitle={SITE_NAME}
    />
  );
}