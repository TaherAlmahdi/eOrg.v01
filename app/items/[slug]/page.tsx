import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ItemView from '@/app/components/ItemView';
import { ITEM_REGISTRY, getItemSlug } from '@/app/lib/content/core/registry/items';
import { buildTabTitle } from '@/app/lib/get-site-data';

interface PageProps {
  params: Promise<{ slug?: string; itemSlug?: string }>;
}

// রেজিস্ট্রি থেকে কঠোরভাবে স্লাগ ও নাম রেজলভ করার ফাংশন
function resolveRegistryItem(rawSlug: string) {
  if (!rawSlug) return null;
  const decoded = decodeURIComponent(rawSlug).trim();

  const mappedSlug = getItemSlug(decoded);
  if (mappedSlug && ITEM_REGISTRY[mappedSlug]) {
    return {
      registrySlug: mappedSlug,
      bengaliName: ITEM_REGISTRY[mappedSlug].name,
    };
  }

  if (ITEM_REGISTRY[decoded]) {
    return {
      registrySlug: decoded,
      bengaliName: ITEM_REGISTRY[decoded].name,
    };
  }

  const matchedKey = Object.keys(ITEM_REGISTRY).find(
    (key) => ITEM_REGISTRY[key]?.name === decoded
  );

  if (matchedKey) {
    return {
      registrySlug: matchedKey,
      bengaliName: ITEM_REGISTRY[matchedKey].name,
    };
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || resolvedParams?.itemSlug || '';
  const resolved = resolveRegistryItem(rawSlug);
  
  if (!resolved) {
    return { title: 'পাতা পাওয়া যায়নি' };
  }

  const headersList = await headers();
  const host = headersList.get('host') || '';
  const siteName = 'প্রকরণ ❀ এডুলিচার পাঠশালা'; // আপনার প্রয়োজনমতো সাইট নেম

  const pageTitle = buildTabTitle({
    currentPageTitle: resolved.bengaliName,
    siteName,
  });

  return {
    title: pageTitle,
    openGraph: { title: pageTitle },
    twitter: { title: pageTitle },
  };
}

export default async function SingleItemsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || resolvedParams?.itemSlug || '';

  // রেজিস্ট্রি থেকে কঠোর ভ্যালিডেশন; না মিললে সরাসরি 404
  const resolvedItem = resolveRegistryItem(rawSlug);
  if (!resolvedItem) {
    notFound();
  }

  const { registrySlug, bengaliName } = resolvedItem;
  const searchSlugs = Array.from(new Set([rawSlug, registrySlug, bengaliName].filter(Boolean)));

  return (
    <div className="flex w-full items-center justify-between mt-0 px-2 sm:px-4 md:px-4 py-2 mb-4">
      <ItemView slug={registrySlug} slugsArray={searchSlugs} />
    </div>
  );
}