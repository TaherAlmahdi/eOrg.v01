// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/admin/'], // প্রয়োজন অনুযায়ী পরিবর্তন করুন
    },
    sitemap: 'https://www.eduliture.org/sitemap.xml',
  };
}

