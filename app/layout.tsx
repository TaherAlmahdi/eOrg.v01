import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "বঙ্কিম রচনাবলী | এডুলিচার",
  description: "সাহিত্যসম্রাট বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের কালজয়ী রচনাবলীর ডিজিটাল সংগ্রহশালা; একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প।",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn" // ভাষা 'bn' করে দেওয়া হয়েছে যেহেতু এটি বাংলা সাহিত্য সাইট
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fdfdf7] text-gray-900">
        {/* হেডার এখানে যুক্ত করুন যেন সব পেজে দেখা যায় */}
        <Header />
        
        <main className="flex-grow">
          {children}
        </main>

        {/* ফুটার এখানে যুক্ত করুন যেন সব পেজে দেখা যায় */}
        <Footer />
      </body>
    </html>
  );
}