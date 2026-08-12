import { headers } from 'next/headers';
import { MetadataRoute } from 'next';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const rawHost = headersList.get('host') || '';
  const host = rawHost.split(':')[0]; // পোর্ট নম্বর বাদ দেওয়া হলো

  // library.eduliture.org এবং লোকালহোস্টে টেস্ট করার শর্ত
  const isLibrarySubdomain = 
    host.startsWith('library.') || 
    host === 'library.eduliture.org' || 
    host.includes('localhost') || 
    host === '127.0.0.1';

  if (!isLibrarySubdomain) {
    return {
      name: 'Eduliture',
      short_name: 'Eduliture',
      start_url: '/',
      display: 'browser',
    };
  }

  return {
    name: 'eLibrary',
    short_name: 'eLibrary',
    description: 'বাংলা ভাষায় সর্বাধিক গ্রন্থের সমাহার',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc', // bg-slate-50 এর হেক্স কোড
    theme_color: '#047857',      // bg-emerald-700 এর হেক্স কোড
    icons: [
      {
        src: '/icons/library-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/library-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}