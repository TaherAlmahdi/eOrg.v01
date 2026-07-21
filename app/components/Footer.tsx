'use client';
import Link from 'next/link';
import Image from 'next/image';

import publicLogo from '../../public/logo/logo.png'; 

const Footer = () => {
  // ইংরেজি সালকে বাংলায় রূপান্তর করার ফাংশন
  const getBengaliYear = () => {
    const year = new Date().getFullYear().toString();
    const bengaliDigits: { [key: string]: string } = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return year.split('').map(digit => bengaliDigits[digit]).join('');
  };

  return (
    <footer className="bg-[#e0e0eb] max-w-full border-t border-gray-200 py-1 px-1 font-tarunima mt-auto">
      <div className="max-w-full mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-1 text-center md:text-left">
          
          {/* বামপাশ: এডুলিচার লোগো, নাম ও ট্যাগ */}
          <div className="flex items-center gap-3">
            <Link href="https://eduliture.org" target="_blank" className="shrink-0">
              <div className="w-12 h-12 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                <Image 
                  src={publicLogo} 
                  alt="এডুলিচার লোগো" 
                  width={44} 
                  height={44}
                  className="object-contain"
                />
              </div>
            </Link>
            <div className="flex flex-col justify-center items-start">
              <Link href="https://eduliture.org" target="_blank" className="group">
                <span className="text-xl font-bold font-tarunima text-[#008080] group-hover:text-[#006666] transition-colors leading-none">
                  এডুলিচার
                </span>
              </Link>
              <p className="text-[10px] font-tarunima text-gray-500 font-normal mt-1 tracking-widest leading-none">
                বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান
              </p>
            </div>
          </div>

          {/* ডানপাশ: কপিরাইট (বড় স্ক্রিনে ডানে, মোবাইলে নিচে) */}
          <div className="md:text-right font-tarunima border-t md:border-t-0 border-gray-300 pt-1 md:pt-0 w-full md:w-auto">
            <p className="text-base text-gray-600 leading-relaxed">
              © ১৯৯৯ - {getBengaliYear()} এডুলিচার কর্তৃক সমস্ত অধিকার সংরক্ষিত।
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;