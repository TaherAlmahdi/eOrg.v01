'use client';
import { Sparkles as SparklesIcon, BookOpen as BookOpenIcon, Info as InfoIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// আপনার স্ট্রাকচার অনুযায়ী: app/componant থেকে এক ধাপ উপরে উঠে app/public এ যেতে হবে
import bankimImage from '../../public/bankim.png';

const Hero = () => {
  return (
      <div className="relative w-full overflow-hidden">
        <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[350px] md:h-[500px] md:relative md:w-full md:left-auto md:right-auto md:ml-0 md:mr-0 md:aspect-[2/3] md:rounded-xl md:border-4 md:border-white md:shadow-2xl md:max-w-none">
          
          <Image 
            src={bankimImage} 
            alt="সাহিত্য সম্রাট বঙ্কিমচন্দ্র চট্টোপাধ্যায়"
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 600px"
          />

          {/* গ্রেডিয়েন্ট ওভারলে */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
      </div>
      
  );
};

export default Hero;