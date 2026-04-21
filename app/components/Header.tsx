'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, BookOpen, Info, Feather, History, Mail, Library, Archive } from 'lucide-react';
import Image from 'next/image';
import siteLogo from '../../public/logo.png'; 

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // মেনু ওপেন থাকলে স্ক্রল লক করার জন্য
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  return (
    <header className="bg-[#ffffff] border-b border-gray-200 py-2 px-3 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        
        {/* লোগো সেকশন */}
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

        {/* মেনু বাটন */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open Menu"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#008080]"
        >
          <Menu size={28} />
        </button>

        {/* মোডাল মেনু ওভারলে */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* ব্যাকড্রপ */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* মেনু কন্টেন্ট প্যানেল */}
            <div className="relative w-full max-w-sm bg-[#fdfdf7] h-full overflow-y-auto p-6 md:p-10 shadow-2xl animate-in slide-in-from-right duration-300 font-tarunima">
              
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-[#008080]">বঙ্কিম রচনাবলী</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <nav className="space-y-3">
                {/* লিংকগুলোতে /genre/ যুক্ত করা হয়েছে */}
                <MenuLink href="/genre/novel" icon={<BookOpen size={22} />} title="উপন্যাস সমগ্র" desc="বঙ্কিমচন্দ্রের কালজয়ী উপন্যাসসমূহ" color="blue" close={() => setIsMenuOpen(false)} />
                <MenuLink href="/genre/humor" icon={<Feather size={22} />} title="রম্য সাহিত্য" desc="কমলাকান্তের দপ্তর ও রম্য রচনা" color="teal" close={() => setIsMenuOpen(false)} />
                <MenuLink href="/genre/religious" icon={<Library size={22} />} title="ধর্মীয় সাহিত্য" desc="ধর্মতত্ত্ব ও কৃষ্ণচরিত্র বিষয়ক আলোচনা" color="orange" close={() => setIsMenuOpen(false)} />
                <MenuLink href="/genre/essays" icon={<History size={22} />} title="ইতিহাস ও প্রবন্ধ" desc="ঐতিহাসিক ও বিবিধ গবেষণামূলক প্রবন্ধ" color="purple" close={() => setIsMenuOpen(false)} />
                <MenuLink href="/genre/letters" icon={<Mail size={22} />} title="পত্রাবলী" desc="চিঠিপত্র ও দলিলাদি" color="pink" close={() => setIsMenuOpen(false)} />
                <MenuLink href="/genre/others" icon={<Archive size={22} />} title="বিবিধ রচনা" desc="অগ্রন্থিত ও অপ্রকাশিত রচনাসংগ্রহ" color="indigo" close={() => setIsMenuOpen(false)} />
                <MenuLink href="/about" icon={<Info size={22} />} title="প্রকল্প পরিচয়" desc="বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য" color="gray" close={() => setIsMenuOpen(false)} />
              </nav>

              <div className="mt-8 pt-4 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans">
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

const MenuLink = ({ href, icon, title, desc, color, close }: any) => (
  <Link 
    href={href} 
    onClick={close}
    className="flex items-center gap-5 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#008080] hover:shadow-md transition-all group"
  >
    <div className={`p-3 rounded-xl transition-colors bg-gray-50 text-gray-600 group-hover:bg-[#008080] group-hover:text-white`}>
      {icon}
    </div>
    <div>
      <h3 className="text-md font-bold text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 leading-tight">{desc}</p>
    </div>
  </Link>
);

export default Header;