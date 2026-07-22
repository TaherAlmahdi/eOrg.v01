// components/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as Icons from 'lucide-react'; 
import { headerConfig } from '../lib/headerConfig'; 

interface HeaderProps {
  domainKey: string;
}

// headerConfig অবজেক্টের জন্য টাইপ ডিফাইন করা হলো যেন টাইপস্ক্রিপ্ট এরর না দেয়
interface HeaderConfigItem {
  siteName: string;
  tagline: string;
  logo: string;
  favicon?: string;
  bgColor?: string;
  themeColor: string;
  menu: Array<{
    label: string;
    url: string;
    icon: string;
    desc?: string;
  }>;
}

// সাবডোমেন রাউটিং ম্যানেজ করার জন্য একটি লাইটওয়েট ইনলাইন হেল্পার ফাংশন
const createDynamicUrl = (targetUrl: string): string => {
  if (typeof window === 'undefined') return targetUrl.startsWith('goto:') ? '/' : targetUrl;
  if (!targetUrl.startsWith('goto:')) return targetUrl;

  const targetSubdomain = targetUrl.split(':')[1];
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;
  const isLocalhost = hostname.includes('localhost');

  if (isLocalhost) {
    if (targetSubdomain === 'main') return `${protocol}//localhost${port}`;
    return `${protocol}//${targetSubdomain}.localhost${port}`;
  } else {
    const parts = hostname.split('.');
    const baseDomain = parts.slice(-2).join('.'); 
    if (targetSubdomain === 'main') return `${protocol}//${baseDomain}`;
    return `${protocol}//${targetSubdomain}.${baseDomain}`;
  }
};

// স্ট্রিং নাম থেকে ডাইনামিক লুসিড আইকন জেনারেট করার জন্য
const DynamicIcon = ({ name, size = 22 }: { name: string; size?: number }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.BookOpen size={size} />; 
  return <IconComponent size={size} />;
};

// টাইটেলকে মাল্টিপল কালারে স্প্লিট করার ডাইনামিক ফাংশন
const RenderTitle = ({ title }: { title: string }) => {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) {
    return <span className="text-[#008080]">{words[0]}</span>;
  }
  return (
    <>
      <span className="text-[#008080]">{words[0]} </span>
      <span className="text-[#cc7a00]">{words.slice(1).join(' ')}</span>
    </>
  );
};

const Header = ({ domainKey }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ডাইনামিক কনফিগ গেট করা (টাইপসহ)
  const currentHeader: HeaderConfigItem = (headerConfig as Record<string, HeaderConfigItem>)[domainKey] || 
    (headerConfig as Record<string, HeaderConfigItem>).main || {
    siteName: "এডুলিচার",
    tagline: "বিশুদ্ধজ্ঞানের প্রত্যয়",
    logo: "/logo/logo.png",
    favicon: "/favicon.ico",
    bgColor: "bg-[#ffffff]",
    themeColor: "teal",
    menu: [{ label: "হোম", url: "/", icon: "BookOpen", desc: "প্রধান পাতা" }]
  };

  // স্ক্রোল লক এবং ডাইনামিক ফেভিকন/টাইটেল ক্লায়েন্ট-সাইড আপডেট
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

//  useEffect(() => {
//   if (typeof window !== 'undefined' && currentHeader) {
      // ব্রাউজার ট্যাব টাইটেল আপডেট
//      document.title = `${currentHeader.siteName} - ${currentHeader.tagline}`;
      
      // ব্রাউজার ফেভিকন ডাইনামিক আপডেট
//      if (currentHeader.favicon) {
//        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
//        if (!link) {
//          link = document.createElement('link');
//          link.rel = 'icon';
//          document.getElementsByTagName('head')[0].appendChild(link);
//        }
//        link.href = currentHeader.favicon;
//      }
//    }
//  }, [currentHeader]);

  // থিম অনুসারে বর্ডার ও আইকনের হোভার কালার সেট করার ডাইনামিক অবজেক্ট
  const themeClasses: Record<string, string> = {
    teal: 'text-[#008080] hover:border-[#008080] group-hover:bg-[#008080]',
    emerald: 'text-emerald-700 hover:border-emerald-600 group-hover:bg-emerald-600',
    amber: 'text-amber-800 hover:border-amber-700 group-hover:bg-amber-700',
    purple: 'text-purple-700 hover:border-purple-600 group-hover:bg-purple-600',
    blue: 'text-blue-700 hover:border-blue-600 group-hover:bg-blue-600'
  };

  const currentTheme = themeClasses[currentHeader.themeColor] || themeClasses.teal;
  const headerBgColor = currentHeader.bgColor || "bg-[#ffffff]";

  return (
    <header className={`${headerBgColor} border-b border-gray-200 py-2 px-3 sticky top-0 z-50 shadow-sm font-tarunima`}>
      <div className="max-w-full mx-auto flex items-center justify-between gap-4">
        
        {/* লোগো সেকশন */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Image 
                src={currentHeader.logo} // কনফিগ ফাইল থেকে সরাসরি ডাইনামিক পাথ
                alt={`${currentHeader.siteName} Logo`}
                width={48}
                height={48}
                className="w-full h-full object-contain drop-shadow-md"
                priority
              />
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-2xl md:text-3xl font-black font-tarunima leading-none tracking-normal md:tracking-[1px] pb-1">
                <RenderTitle title={currentHeader.siteName} />
              </h1>
              <p className="hidden md:block text-[14px] mt-1 font-tarunima font-normal tracking-[1px]">
                <span className="text-gray-600">{currentHeader.tagline}</span>
              </p>
            </div>
          </Link>
        </div>

        {/* মেনু বাটন */}
        <button 
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open Menu"
          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${currentTheme.split(' ')[0]}`}
        >
          <Icons.Menu size={28} />
        </button>

        {/* মোডাল মেনু ওভারলে */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-100 flex justify-end">
            {/* ব্যাকড্রপ */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* মেনু কন্টেন্ট প্যানেল */}
            <div className="relative w-full max-w-sm bg-[#fdfdf7] h-full overflow-y-auto p-6 md:p-10 shadow-2xl animate-in slide-in-from-right duration-300 font-tarunima">
              
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className={`text-xl font-tarunima font-bold ${currentTheme.split(' ')[0]}`}>
                  {currentHeader.siteName} মেনু
                </h2>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                >
                  <Icons.X size={28} />
                </button>
              </div>

              {/* লেআউট ম্যাপ আইটেম */}
              <nav className="space-y-3 font-tarunima">
                {currentHeader.menu?.map((item: any, index: number) => (
                  <MenuLink 
                    key={index}
                    href={createDynamicUrl(item.url)}
                    icon={<DynamicIcon name={item.icon} />}
                    title={item.label}
                    desc={item.desc || ""}
                    close={() => setIsMenuOpen(false)}
                    themeClasses={currentTheme}
                  />
                ))}
              </nav>

              <div className="mt-8 pt-4 text-center border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-tarunima">
                  বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// মেনু লিংক সাব-কম্পোনেন্ট
const MenuLink = ({ href, icon, title, desc, close, themeClasses }: any) => {
  const hoverBorderColor = themeClasses.split(' ')[1]; 
  const activeIconBg = themeClasses.split(' ')[2];     

  return (
    <Link 
      href={href} 
      onClick={close}
      className={`flex items-center gap-5 p-4 bg-white rounded-xl border border-gray-100 ${hoverBorderColor} hover:shadow-md transition-all group font-tarunima`}
    >
      <div className={`p-3 rounded-xl transition-colors bg-gray-50 text-gray-600 ${activeIconBg} group-hover:text-white`}>
        {icon}
      </div>
      <div>
        <h3 className="text-md font-tarunima font-bold text-gray-800">{title}</h3>
        <p className="text-xs font-tarunima text-gray-500 leading-tight">{desc}</p>
      </div>
    </Link>
  );
};

export default Header;