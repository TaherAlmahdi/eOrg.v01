// app/robots.ts
import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') || 'www.eduliture.org';
  const isLocal = host.includes('localhost') || /^\d{1,3}(\.\d{1,3}){3}/.test(host);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/admin/', '/api/', '/local-media/'],
    },
    // each (sub)domain points to its own sitemap
    sitemap: `${isLocal ? 'http' : 'https'}://${host}/sitemap.xml`,
  };
}
