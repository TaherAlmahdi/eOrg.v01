import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BiographyContent from '@/app/components/BiographyContent';
import { getSubdomainData } from '@/app/lib/get-site-data';
import { getBioData, bioMetadata } from '@/app/lib/bio';
import { loadSlugManifest } from '@/app/lib/books/r2';
import { getAuthorSlugFromTitle, getSlug } from '@/app/lib/content/core/registry';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** /bio/<slug> or /bio/<name>: tries the segment as a slug first, then as an author name. */
async function loadBio(rawSegment: string) {
  await loadSlugManifest();
  const segment = decodeURIComponent(rawSegment).trim();

  const direct = await getBioData(segment);
  if (direct) return direct;

  const slugFromName = getAuthorSlugFromTitle(segment) || getSlug('authors', segment);
  if (slugFromName && slugFromName !== segment) return getBioData(slugFromName);
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const host = (await headers()).get('host');
  const bio = await loadBio(slug);
  if (!bio) return { title: 'জীবনী খুঁজে পাওয়া যায়নি' };
  return bioMetadata(bio.frontmatter, getSubdomainData(host));
}

export default async function AuthorBioPage({ params }: PageProps) {
  const { slug } = await params;
  const bio = await loadBio(slug);
  if (!bio) notFound();

  return <BiographyContent frontmatter={bio.frontmatter} content={bio.content} />;
}
