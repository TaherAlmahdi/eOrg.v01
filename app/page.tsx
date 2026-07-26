// app/page.tsx


import WelcomeSection from './components/WelcomeSection';
import FeatureSection from './components/FeatureSection';
import AboutSection from './components/AboutSection';
import GenreList from './components/GenreList';
import SuccessStories from './components/SuccessStories';
import { 
  BookOpen, Info, Users, Sparkles, ShieldCheck, 
  Zap, Feather, Library, History, Mail, Archive
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

// মেটাডেটা এবং ওজি ইমেজ সেটআপ
export const metadata: Metadata = {
  title: "এডুলিচার ❀ বিশুদ্ধজ্ঞানের প্রত্যয়",
  description: "জ্ঞান হোক উন্মুক্ত।",
  openGraph: {
    title: "এডুলিচার ❀ বিশুদ্ধজ্ঞানের প্রত্যয়",
    description: "শিক্ষা, সাহিত্য, সংস্কৃতি–বিশুদ্ধজ্ঞান।",
    url: 'https://www.eduliture.org', // আপনার ডোমেইন অনুযায়ী পরিবর্তন করুন
    siteName: 'এডুলিচার',
    images: [
      {
        url: '/og-image.jpg', // public ফোল্ডারে থাকা ওজি ইমেজের পাথ
        width: 1200,
        height: 630,
        alt: 'এডুলিচার প্রবেশক',
      },
    ],
    locale: 'bn_BD',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "এডুলিচার ❀ বিশুদ্ধজ্ঞানের প্রত্যয়",
    description: "শিক্ষা, সাহিত্য, সংস্কৃতি–বিশুদ্ধজ্ঞান।",
    images: ['/og-image.jpg'],
  },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fdfdf7]">
      <main className="grow">

        {/* ফিচার কন্টেন্ট সেকশন */}
        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">
            <WelcomeSection />
          </div>
        </section>
        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">
            <FeatureSection />
          </div>
        </section>

        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">               
            <SuccessStories />
          </div>
        </section>

        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">
            <AboutSection />
          </div>
        </section>   

      </main>
    </div>
  );
}