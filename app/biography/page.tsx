import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BiographyContent from '@/app/components/BiographyContent';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getBioData, bioMetadata } from '@/app/lib/bio';

// সাবডোমেনের নামে বায়ো ফাইল না থাকলে এই লেখক-স্লাগে খোঁজা হয় (ফাইলের নাম লেখকের স্লাগে বদলালে সাবডোমেন-পাতা যেন না ভাঙে)
const SUBDOMAIN_BIO_SLUG: Record<string, string> = {
  bankim: 'bankim-chandra-chatterjee',
};

// ১. সাবডোমেন বের করার হেল্পার
async function getOnlySubdomain(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  const hostWithoutPort = host.split(':')[0];
  const parts = hostWithoutPort.split('.');

  if (parts.length > 1) {
    const firstPart = parts[0].toLowerCase();
    if (firstPart !== 'www' && firstPart !== 'localhost') {
      return firstPart;
    }
  }

  return null;
}

// ২. R2 থেকে বায়োগ্রাফি ডাটা লোড করা (pages/bio/<সাবডোমেন>.md, না পেলে লেখক-স্লাগে)
async function getSubdomainBio(subdomain: string | null) {
  if (!subdomain) return null;
  const bio = await getBioData(subdomain);
  if (bio) return bio;
  const alias = SUBDOMAIN_BIO_SLUG[subdomain.toLowerCase()];
  return alias ? getBioData(alias) : null;
}

// ৩. 🏷️ Dynamic Metadata Export
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host');
  const siteData = getSubdomainData(host);

  const subdomain = await getOnlySubdomain();
  const bioData = await getSubdomainBio(subdomain);

  if (!bioData) {
    return {
      title: 'জীবনী খুঁজে পাওয়া যায়নি',
    };
  }

  return bioMetadata(bioData.frontmatter, siteData);
}

// ৪. মেইন পেজ কম্পোনেন্ট (Server Page Controller)
export default async function BiographyPage() {
  const subdomain = await getOnlySubdomain();

  if (!subdomain) {
    notFound();
  }

  const bioData = await getSubdomainBio(subdomain);

  if (!bioData) {
    notFound();
  }

  return (
    <BiographyContent
      frontmatter={bioData.frontmatter}
      content={bioData.content}
    />
  );
}
