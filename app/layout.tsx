import type { Metadata } from "next";
import localFont from 'next/font/local';
import Script from 'next/script';
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

// ফন্ট কনফিগারেশন:preload অপশনটি সতর্কতার সাথে ব্যবহার করা হয়েছে
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
  preload: false, // সব ফন্ট একসাথে প্রিলোড করলে 'not used within a few seconds' ওয়ার্নিং আসে
});

const tarunima = localFont({
  src: '../public/fonts/Tarunima.woff2',
  variable: '--font-tarunima',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bankim-rachanabali.vercel.app'),
  title: {
    default: 'বঙ্কিম রচনাবলী',
    template: '%s | বঙ্কিম রচনাবলী'
  },
  description: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের সকল সাহিত্যকর্মের ডিজিটাল সংগ্রহশালা',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${mallika.variable} ${sabrina.variable} ${tarunima.variable} h-full antialiased`}
    >
      <head>
        {/* গুগল অ্যাডসেন্স: data-nscript এরর এড়াতে strategy পরিবর্তন করা হয়েছে। 
          Next.js-এ AdSense-এর জন্য 'lazyOnload' সবচেয়ে নিরাপদ। 
        */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5551708286100565"
          crossOrigin="anonymous"
          strategy="lazyOnload" 
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#fdfdf7] text-gray-900 font-tarunima">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}