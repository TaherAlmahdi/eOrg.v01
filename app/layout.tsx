// app/layout.tsx
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // ১. ডোমেন থেকে সাবডোমেনটি আলাদা করুন
  // (যেমন: "math.eduliture.org" -> "math" অথবা "math.localhost:3000" -> "math")
  const hostname = host.split(':')[0]; // পোর্ট থাকলে তা সরিয়ে ফেলবে (e.g., localhost:3000 -> localhost)
  const parts = hostname.split('.');
  
  // ডোমেন ফরম্যাট যাচাই (eduliture.org এর জন্য parts.length > 2, আর localhost এর জন্য parts.length > 1)
  const isSubdomain =
    (hostname.includes('eduliture.org') && parts.length > 2 && parts[0] !== 'www') ||
    (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost');

  const subdomain = isSubdomain ? parts[0] : null;

  // ২. সাবডোমেন অনুযায়ী আইকনের পাথ ঠিক করুন
  let iconPath = '/favicon.ico'; // মূল ডোমেনের জন্য ডিফল্ট app/favicon.ico ব্যবহার করবে

  if (subdomain) {
    const targetIconName = `${subdomain}.ico`;
    const localFilePath = path.join(process.cwd(), 'public', 'favicons', targetIconName);

    // ফাইলটি public/favicons/ এ বাস্তবেই আছে কি না চেক করে দেখা
    if (fs.existsSync(localFilePath)) {
      iconPath = `/favicons/${targetIconName}`;
    } else {
      // নির্দিষ্ট সাবডোমেনের .ico ফাইল না থাকলে default.ico বা মূল favicon.ico ব্যবহার করবে
      const defaultSubPath = path.join(process.cwd(), 'public', 'favicons', 'default.ico');
      iconPath = fs.existsSync(defaultSubPath) ? '/favicons/default.ico' : '/favicon.ico';
    }
  }

  return {
    title: 'Eduliture',
    icons: {
      // এটি ব্রাউজারের <head> এ ডাইনামিকভাবে সঠিক .ico ফাইলটি লিঙ্ক করবে
      icon: iconPath,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}