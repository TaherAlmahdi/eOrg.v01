'use client';
import Image from 'next/image';
import bankimImage from '../../public/bankim.png';

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden">
      {/* মোবাইলে (Default): w-full এবং h-auto ব্যবহার করা হয়েছে যাতে রেশিও ঠিক থাকে।
        ডেক্সটপে (md:): আপনার আগের নির্দিষ্ট রেশিও ও বর্ডার বজায় রাখা হয়েছে।
      */}
      <div className="relative w-full h-auto aspect-[2/3] md:aspect-[2/3] md:rounded-xl md:border-4 md:border-white md:shadow-2xl overflow-hidden bg-transparent">
        
        <Image 
          src={bankimImage} 
          alt="সাহিত্য সম্রাট বঙ্কিমচন্দ্র চট্টোপাধ্যায়"
          fill
          /* object-contain: ছবি ক্রপ হওয়া রোধ করবে এবং রেশিও ঠিক রাখবে।
            bg-transparent: ছবির পেছনের অংশ স্বচ্ছ রাখবে।
          */
          className="object-contain transition-transform duration-500 hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, 300px"
        />

        {/* গ্রেডিয়েন্ট ওভারলে (ছবির রেশিও ঠিক রাখতে এটি হালকা রাখা হয়েছে) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Hero;