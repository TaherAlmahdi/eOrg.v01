'use client';

import Image from 'next/image';
import lightedCandle from '../../public/lighted-candle.png'; // আপনার পিএনজি বা জিআইএফ ছবি

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden flex justify-center items-center">
      {/* 
        মোবাইলে (Default): w-full এবং h-auto ব্যবহার করা হয়েছে যাতে রেশিও ঠিক থাকে।
        ডেক্সটপে (md:): আপনার আগের নির্দিষ্ট রেশিও ও বর্ডার বজায় রাখা হয়েছে।
        animate-glow: টেলউইন্ড থেকে আসা মিটিমিটি আলোকছটার অ্যানিমেশন
      */}
      <div className="relative w-full h-auto aspect-square md:aspect-square md:rounded md:shadow-2xl overflow-hidden bg-transparent animate-glow">
        
        <Image 
          src={lightedCandle} 
          alt="বিশুদ্ধজ্ঞানের আলোক"
          fill
          /* 
            object-contain: ছবি ক্রপ হওয়া রোধ করবে এবং রেশিও ঠিক রাখবে।
            animate-flicker: টেলউইন্ড থেকে আসা শিখা কাঁপার অ্যানিমেশন
          */
          className="object-contain transition-transform duration-500 hover:scale-105 animate-flicker"
          priority
          sizes="(max-width: 768px) 100vw, 300px"
        />

        {/* গ্রেডিয়েন্ট ওভারলে (ছবির রেশিও ঠিক রাখতে এটি হালকা রাখা হয়েছে) */}
        
      </div>
    </div>
  );
};

export default Hero;