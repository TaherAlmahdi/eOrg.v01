// lib/headerConfig.ts

export interface MenuItem {
  label: string;
  url: string;   // সাধারণ পাথ (যেমন: '/blogs') বা সাবডোমেন সংকেত (যেমন: 'goto:library:')
  icon: string;  // Lucide Icon এর নাম (যেমন: 'BookOpen', 'Feather')
  desc?: string; // মেনুর বিবরণ
  color?: string;
}

export interface DomainConfig {
  siteName: string;  // সাইটের নাম (যেমন: "বঙ্কিম রচনাবলী")
  tagline: string;   // সাইটের ট্যাগলাইন বা স্লোগান
  logo: string;      // সাইটের সুনির্দিষ্ট লোগো ইমেজের পাথ (যেমন: "/images/logo-main.png")
  siteUrl: string;   // প্রোডাকশনে লাইভ সাবডোমেন/মেইন ইউআরএল (যেমন: "https://eduliture.org")
  bgColor: string;   // হেডারের ব্যাকগ্রাউন্ড কালার ক্লাস (যেমন: "bg-[#ffffff]")
  themeColor: 'teal' | 'emerald' | 'amber' | 'purple' | 'blue'; // সাবডোমেন থিম কালার
  menu: MenuItem[];    // সাবডোমেন ভিত্তিক কাস্টম মেনু অ্যারে
}

// প্রতিটি সাবডোমেনের সম্পূর্ণ ও সঠিক কনফিগারেশন ডাটাবেজ
export const headerConfig: Record<string, DomainConfig> = {
  // মেইন ডোমেন (eduliture.org)
  main: {
    siteName: "এডুলিচার",
    tagline: "বিশুদ্ধজ্ঞানের প্রত্যয়",
    logo: "/logo/logo.png", 
    siteUrl: "https://eduliture.org",
    bgColor: "bg-[#ffffff]",
    themeColor: "teal",
    menu: [
      { label: "হোম", url: "/", icon: "Info", desc: "প্রধান ওয়েবসাইট" },
      { label: "ডিজিটাল লাইব্রেরি", url: "goto:library:", icon: "Library", desc: "অনলাইন লাইব্রেরি সাবডোমেন" },
      { label: "বঙ্কিম আর্কাইভ", url: "goto:bankim:", icon: "Archive", desc: "বঙ্কিমচন্দ্র স্মারক সাবডোমেন" },
      { label: "ব্লগ", url: "/blogs", icon: "Feather", desc: "শিক্ষামূলক নিবন্ধ ও ব্লগসমূহ" }
    ]
  },

  // লাইব্রেরি সাবডোমেন (library.eduliture.org)
  library: {
    siteName: "এডুলিচার লাইব্রেরি",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/logo-library.png",
    siteUrl: "https://library.eduliture.org",
    bgColor: "bg-[#f4fbf7]", 
    themeColor: "emerald",
    menu: [
      { label: "মূল হোমপেজ", url: "goto:main:", icon: "Info", desc: "এডুলিচার প্রধান ওয়েবসাইট" },
      { label: "সব বই", url: "/books", icon: "BookOpen", desc: "লাইব্রেরির সর্বমোট বই সংগ্রহ" },
      { label: "বিভাগসমূহ", url: "/genres", icon: "Library", desc: "ক্যাটাগরি ভিত্তিক বইয়ের তালিকা" },
      { label:"উপন্যাস সমগ্র", url:"/genre/novel", icon: "BookOpen",  desc:"বঙ্কিমচন্দ্রের কালজয়ী উপন্যাসসমূহ", color:"blue"},
      { label:"রম্য সাহিত্য", url:"/genre/humor", icon: "Feather", desc:"কমলাকান্তের দপ্তর ও রম্য রচনা", color:"teal"},
      { label:"ধর্মীয় সাহিত্য", url:"/genre/religious", icon: "Library", desc:"ধর্মতত্ত্ব ও কৃষ্ণচরিত্র বিষয়ক আলোচনা", color:"orange"},
      { label:"ইতিহাস ও প্রবন্ধ", url:"/genre/essays", icon: "History", desc:"ঐতিহাসিক ও বিবিধ গবেষণামূলক প্রবন্ধ", color:"purple"},
      { label:"পত্রাবলী", url:"/genre/letters", icon: "Mail", desc:"চিঠিপত্র ও দলিলাদি", color:"pink"},
      { label:"বিবিধ রচনা", url:"/genre/others", icon: "Archive", desc:"অগ্রন্থিত ও অপ্রকাশিত রচনাসংগ্রহ", color:"indigo"},
      { label:"প্রকল্প পরিচয়", url:"/about", icon: "Info", desc:"বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য", color:"gray"}
    ]
  },

  // বঙ্কিম সাবডোমেন (bankim.eduliture.org)
  bankim: {
    siteName: "বঙ্কিম রচনাবলী",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/logo-bankim.png",
    siteUrl: "https://bankim.eduliture.org",
    bgColor: "bg-[#fffdf9]", 
    themeColor: "amber",
    menu: [
      { label:"উপন্যাস সমগ্র", url:"/genre/novel", icon: "BookOpen",  desc:"বঙ্কিমচন্দ্রের কালজয়ী উপন্যাসসমূহ", color:"blue"},
      { label:"রম্য সাহিত্য", url:"/genre/humor", icon: "Feather", desc:"কমলাকান্তের দপ্তর ও রম্য রচনা", color:"teal"},
      { label:"ধর্মীয় সাহিত্য", url:"/genre/religious", icon: "Library", desc:"ধর্মতত্ত্ব ও কৃষ্ণচরিত্র বিষয়ক আলোচনা", color:"orange"},
      { label:"ইতিহাস ও প্রবন্ধ", url:"/genre/essays", icon: "History", desc:"ঐতিহাসিক ও বিবিধ গবেষণামূলক প্রবন্ধ", color:"purple"},
      { label:"পত্রাবলী", url:"/genre/letters", icon: "Mail", desc:"চিঠিপত্র ও দলিলাদি", color:"pink"},
      { label:"বিবিধ রচনা", url:"/genre/others", icon: "Archive", desc:"অগ্রন্থিত ও অপ্রকাশিত রচনাসংগ্রহ", color:"indigo"},
      { label:"প্রকল্প পরিচয়", url:"/about", icon: "Info", desc:"বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য", color:"gray"}
    ]
  },





  // রবীন্দ্রনাথ ঠাকুর আর্কাইভ সাবডোমেন (rabindra.eduliture.org)
  rabindra: {
    siteName: "রবীন্দ্রনাথ ঠাকুর আর্কাইভ",
    tagline: "রবীন্দ্র রচনাবলী ও গবেষণা",
    logo: "/images/logo-rabindra.png",
    siteUrl: "https://rabindra.eduliture.org",
    bgColor: "bg-[#fdfaff]", 
    themeColor: "purple",
    menu: [
      { label: "মূল হোমপেজ", url: "goto:main:", icon: "Info", desc: "প্রধান ওয়েবসাইট" },
      { label: "কবিতা সমগ্র", url: "/poems", icon: "Feather", desc: "রবীন্দ্র কবিতা ও গান" }
    ]
  }
};