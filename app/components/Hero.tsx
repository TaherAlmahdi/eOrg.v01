'use client';
import { Sparkles as SparklesIcon, BookOpen as BookOpenIcon, Info as InfoIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// আপনার স্ট্রাকচার অনুযায়ী: app/componant থেকে এক ধাপ উপরে উঠে app/public এ যেতে হবে
import bankimImage from '../../public/bankim.png';

const Hero = () => {
  return (
    <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row-reverse items-start justify-between">
      <div className="relative w-full aspect-[2/3] max-w-[240px] md:max-w-none rounded-xl overflow-hidden shadow-2xl border-4 border-white bg-white">
        <Image 
          src={bankimImage} 
          alt="সাহিত্য সম্রাট বঙ্কিমচন্দ্র চট্টোপাধ্যায়"
          fill
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          priority
          />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div>
    </div>
   
  );
};

export default Hero;