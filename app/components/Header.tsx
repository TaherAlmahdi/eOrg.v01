'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, BookOpen, Users, Info, Feather, History, Mail, Library, Archive } from 'lucide-react';
import Image from 'next/image';

import siteLogo from '../../public/logo.png'; 

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#ffffff] border-b border-gray-200 py-2 px-3 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        
        {/* লোগো ও নাম এখন বাম পাশে */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Image 
                src={siteLogo}
                alt="বঙ্কিম রচনাবলী"
                width={48}
                height={48}
                className="w-full h-full object-contain drop-shadow-md"
                priority
              />
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-lg md:text-2xl font-black leading-none tracking-normal md:tracking-[1px]">
                <span className="text-[#008080]">বঙ্কিম</span>
                <span className="text-[#cc7a00]"> রচনাবলী</span>
              </h1>
              <p className="hidden md:block text-[14px] text-gray-600 mt-1 font-normal tracking-[1px]">
                এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প
              </p>
            </div>
          </Link>
        </div>

        {/* ডানপাশে: মেনু বাটন */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open Menu"
          className="p-2 hover:bg-gray-200/50 rounded-lg transition-colors text-[#008080]"
        >
          <Menu size={28} />
        </button>

        {/* মোডাল মেনু (অপরিবর্তিত) */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end">
            <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)}></div>
            
            <div className="relative w-full max-w-sm bg-[#fdfdf7] h-full overflow-y-auto p-6 md:p-10 shadow-2xl transition-transform duration-300 ease-in-out">
              
              <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                <h2 className="text-xl font-bold text-[#008080]">বঙ্কিম রচনাবলী</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <nav className="space-y-2">
                <Link 
                  href="/novel" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
                >
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     <BookOpen size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-800">উপন্যাস সমগ্র</h3>
                     <p className="text-xs text-gray-500">বঙ্কিমচন্দ্রের কালজয়ী উপন্যাসসমূহ</p>
                  </div>
                </Link>

                <Link 
                  href="/humor" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
                >
                  <div className="p-3 bg-teal-50 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                     <Feather size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-800">রম্য সাহিত্য</h3>
                     <p className="text-xs text-gray-500">কমলাকান্তের দপ্তর ও রম্য রচনা</p>
                  </div>
                </Link>

                <Link 
                  href="/religious" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
                >
                  <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                     <Library size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-800">ধর্মীয় সাহিত্য</h3>
                     <p className="text-xs text-gray-500">ধর্মতত্ত্ব ও কৃষ্ণচরিত্র বিষয়ক আলোচনা</p>
                  </div>
                </Link>

                <Link 
                  href="/essays" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
                >
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                     <History size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-800">ইতিহাস ও প্রবন্ধ</h3>
                     <p className="text-xs text-gray-500">ঐতিহাসিক ও বিবিধ গবেষণামূলক প্রবন্ধ</p>
                  </div>
                </Link>

                <Link 
                  href="/letters" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
                >
                  <div className="p-3 bg-pink-50 rounded-xl text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                     <Mail size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-800">পত্রাবলী</h3>
                     <p className="text-xs text-gray-500">চিঠিপত্র ও দলিলাদি</p>
                  </div>
                </Link>

                <Link 
                  href="/others" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
                >
                  <div className="p-3 bg-pink-50 rounded-xl text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                     <Archive size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-800">বিবিধ রচনা</h3>
                     <p className="text-xs text-gray-500">অগ্রন্থিত ও অপ্রকাশিত রচনাসংগ্রহ</p>
                  </div>
                </Link>

                <Link 
                  href="/about" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
                >
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-600 group-hover:bg-[#008080] group-hover:text-white transition-colors">
                     <Info size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-gray-800">প্রকল্প পরিচয়</h3>
                     <p className="text-xs text-gray-500">বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য</p>
                  </div>
                </Link>
              </nav>

              <div className="mt-3 pt-2 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none">
                  Eduliture Pure Knowledge Project
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;