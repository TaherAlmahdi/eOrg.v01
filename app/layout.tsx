import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import Script from 'next/script';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import Header from './components/Header';
import Footer from './components/Footer';
import AOSProvider from './components/AOSProvider';
import { getSubdomainData } from '@/app/lib/get-site-data';

import './globals.css';

// ==========================================
// 🖋️ Local Fonts Configuration
// ==========================================
const mallika = localFont({
  src: '../public/fonts/Mallika.woff2',
  variable: '--font-mallika',
  display: 'swap',
  preload: true,
});

const sabrina = localFont({
  src: '../public/fonts/Sabrina.woff2',
  variable: '--font-sabrina',
  display: 'swap',
  preload: false,
});

const tarunima = localFont({
  src: '../public/fonts/Tarunima.woff2',
  variable: '--font-tarunima',
  display: 'swap',
  preload: true,
});

// ==========================================
// 🛠️ Helper Functions
// ==========================================
function parseDomainContext(host: string) {
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');

  const isSubdomain =
    (hostname.includes('eduliture.org') && parts.length > 2 && parts[0] !== 'www') ||
    (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost');

  const subdomain = isSubdomain ? parts[0] : null;
  const domainKey = subdomain || 'main';

  return { hostname, subdomain, domainKey };
}

function getSubdomainFavicon(subdomain: string | null): string {
  if (!subdomain) return '/favicon.ico';

  const targetIconName = `${subdomain}.ico`;
  const localFilePath = path.join(process.cwd(), 'public', 'favicon', targetIconName);

  if (fs.existsSync(localFilePath)) {
    return `/favicon/${targetIconName}`;
  }

  const defaultSubPath = path.join(process.cwd(), 'public', 'favicon', 'default.ico');
  return fs.existsSync(defaultSubPath) ? '/favicon/default.ico' : '/favicon.ico';
}

// ==========================================
// 🏷️ Metadata Generation
// ==========================================
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  const { subdomain } = parseDomainContext(host);
  const iconPath = getSubdomainFavicon(subdomain);

  const siteData = getSubdomainData(host);
  const siteUrl = host ? `https://${host}` : process.env.NEXT_PUBLIC_SITE_URL || 'https://eduliture.org';

  const defaultTitle = siteData?.title || 'এডুলিচার';
  const mainDomainTitle = 'এডুলিচার';
  const dynamicTitle = subdomain ? defaultTitle : `${mainDomainTitle} ❀ বিশুদ্ধজ্ঞানের প্রত্যয়`;

  // Dynamic OG Image Fallback
  const ogTitleParam = encodeURIComponent(defaultTitle);
  const ogTaglineParam = encodeURIComponent('শিক্ষা, সাহিত্য ও সংস্কৃতি বিষয়ক বিশুদ্ধজ্ঞান প্ল্যাটফর্ম');
  const dynamicGeneratedOg = `${siteUrl}/api/og?title=${ogTitleParam}&tagline=${ogTaglineParam}`;

  const ogImageUrl = siteData?.ogImage || dynamicGeneratedOg;
  const siteDescription = siteData?.description || `${defaultTitle} ❀ শিক্ষা, সাহিত্য ও সংস্কৃতি বিষয়ক বিশুদ্ধজ্ঞান প্ল্যাটফর্ম`;

  return {
    title: {
      template: '%s ❀ এডুলিচার',
      default: dynamicTitle,
    },
    description: siteDescription,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: iconPath,
      shortcut: iconPath,
      apple: iconPath,
    },
    openGraph: {
      title: dynamicTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: mainDomainTitle,
      locale: 'bn_BD',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: defaultTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicTitle,
      description: siteDescription,
      images: [ogImageUrl],
    },
  };
}

// ==========================================
// 🏛️ Root Layout
// ==========================================
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const { domainKey } = parseDomainContext(host);

  return (
    <html
      lang="bn"
      className={`${mallika.variable} ${sabrina.variable} ${tarunima.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* AdSense Standard Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5551708286100565"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fdfdf7] text-gray-900 font-tarunima">
        <AOSProvider />

        <Header domainKey={domainKey} />

        <main className="grow">{children}</main>

        <Footer />

        <Analytics />
        <SpeedInsights />

        {/* Google Analytics Script via Next.js Script Strategy */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MYTW1KXYEG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MYTW1KXYEG');
          `}
        </Script>
      </body>
    </html>
  );
}