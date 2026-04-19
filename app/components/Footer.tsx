'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Lightbulb } from 'lucide-react';

// ইমেজ পাথ সংশোধন (tsconfig.json এ @ সেট থাকলে @/public/logo.png ব্যবহার করা যাবে)
import publicLogo from '../../public/elogo.png'; 
import siteLogo from '../../public/logo.png'; 

const Footer = () => {
  const edulitureLinks = [
    { name: 'অনলাইন লাইব্রেরি', href: '#' },
    { name: 'এডুলিচার বাংলাকোষ', href: '#' },
    { name: 'বিদ্যাসাগর রচনাবলী', href: '#' },
    { name: 'বঙ্কিম রচনাবলী', href: '#' },
    { name: 'রবীন্দ্র রচনাবলী', href: '#' },
    { name: 'শরৎ রচনাবলী', href: '#' },
    { name: 'নজরুল রচনাবলী', href: '#' },
    { name: 'জীবনানন্দ রচনাবলী', href: '#' },
    { name: 'এডুলিচার ইবুক', href: '#' },
  ];

  return (
    <footer className="bg-[#e0e0eb] border-t border-gray-200 py-5 px-4 font-sans mt-auto">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ১. প্রথম কলাম (২৫%) */}
        <div className="lg:col-span-3 flex flex-col items-start order-1 not-prose">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Image 
                src={siteLogo}
                alt="বঙ্কিম রচনাবলী লোগো"
                width={44}
                height={44}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-black leading-none tracking-[3px]">
                <span className="text-[#008080]">বঙ্কিম</span>
                <span className="text-[#cc7a00]"> রচনাবলী</span>
              </h1>
              <p className="!text-[12px] text-gray-500 mt-1 font-normal tracking-[1.5px]">
                এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প
              </p>
            </div>
          </Link>
          
          <p className="!text-sm text-gray-500 leading-relaxed mt-1 text-justify">
            সাহিত্যসম্রাট বঙ্কিমচন্দ্র চট্টোপাধ্যায় রচিত উপন্যাস, রম্যরচনা, প্রবন্ধ, ধর্মীয় সাহিত্যের অনলাইন সংগ্রহ।
          </p>
        </div>

        {/* ২. দ্বিতীয় কলাম (৫০%) */}
        <div className="lg:col-span-6 order-2 w-full">
          <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-1">
            <Lightbulb size={18} className="text-[#cc7a00]" />
            <h2 className="text-base font-bold text-gray-800">এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-1">
            {edulitureLinks.map((item, index) => (
              <Link 
                key={index} 
                href={item.href}
                className="p-[2px] text-[14px] font-medium text-gray-600 hover:text-[#008080] transition-all duration-300 flex items-center gap-2 group"
              >
                <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-[#008080] transition-colors flex-shrink-0"></span>
                <span className="leading-tight">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ৩. তৃতীয় কলাম (২৫%) */}
        <div className="lg:col-span-3 flex flex-col items-start gap-2 order-3">
          <div className="flex items-center gap-3">
            <Link href="https://eduliture.org" target="_blank" className="flex-shrink-0">
              <div className="w-12 h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Image 
                  src={publicLogo} 
                  alt="এডুলিচার লোগো" 
                  width={44} 
                  height={44}
                  className="object-contain"
                />
              </div>
            </Link>
            <div className="flex flex-col justify-center">
              <Link href="https://eduliture.org" target="_blank" className="group">
                <span className="text-xl font-bold text-[#008080] group-hover:text-[#006666] transition-colors leading-none">
                  এডুলিচার
                </span>
              </Link>
              <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest leading-none">
                বিশুদ্ধজ্ঞান প্রকল্প
              </p>
            </div>
          </div>
                
          <div className="text-sm text-gray-500 text-left leading-relaxed mt-1">
            একটি <span className="text-[#008080] font-semibold">এডুলিচার</span> বিশুদ্ধজ্ঞান প্রকল্প <br />
            © {new Date().getFullYear()} এডুলিচার কর্তৃক সমস্ত অধিকার সংরক্ষিত।
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;