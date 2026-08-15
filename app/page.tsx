// app/page.tsx

import WelcomeSection from './components/WelcomeSection';
import FeatureSection from './components/FeatureSection';
import AboutSection from './components/AboutSection';
import SuccessStories from './components/SuccessStories';
import { Metadata } from 'next';

// 🌐 মেটাডেটা এবং সোশ্যাল শেয়ারিং (OG) কনফিগারেশন
export const metadata: Metadata = {
  metadataBase: new URL('https://www.eduliture.org'),
  title: "এডুলিচার ❀ বিশুদ্ধজ্ঞানের প্রত্যয়",
  description: "শিক্ষা, সাহিত্য, সংস্কৃতি–বিশুদ্ধজ্ঞান। জ্ঞান হোক উন্মুক্ত।",
  alternates: {
    canonical: 'https://www.eduliture.org',
  },
  openGraph: {
    title: "এডুলিচার ❀ বিশুদ্ধজ্ঞানের প্রত্যয়",
    description: "শিক্ষা, সাহিত্য, সংস্কৃতি–বিশুদ্ধজ্ঞান।",
    url: 'https://www.eduliture.org',
    siteName: 'এডুলিচার',
    images: [
      {
        url: 'https://www.eduliture.org/api/og?title=এডুলিচার&tagline=বিশুদ্ধজ্ঞানের%20প্রত্যয়',
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
    title: "এডুলিচার ❀ বিশুদ্ধজ্ঞানের প্রত্যয়",
    description: "শিক্ষা, সাহিত্য, সংস্কৃতি–বিশুদ্ধজ্ঞান।",
    images: ['https://www.eduliture.org/api/og?title=এডুলিচার&tagline=বিশুদ্ধজ্ঞানের%20প্রত্যয়'],
  },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fdfdf7]">
      <main className="grow">

        {/* ১. স্বাগতম সেকশন */}
        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">
            <WelcomeSection />
          </div>
        </section>

        {/* ২. বৈশিষ্ট্য সেকশন */}
        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">
            <FeatureSection />
          </div>
        </section>

        {/* ৩. সফলতার গল্প/কৃতিত্ব সেকশন */}
        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">              
            <SuccessStories />
          </div>
        </section>

        {/* ৪. আমাদের কথা / পরিচিতি সেকশন */}
        <section data-aos="fade-down" className="relative bg-white">
          <div className="max-w-full mx-auto">
            <AboutSection />
          </div>
        </section>   

      </main>
    </div>
  );
}