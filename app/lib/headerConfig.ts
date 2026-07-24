// lib/headerConfig.ts

export interface MenuItem {
  label: string;
  url: string;   // সাধারণ পাথ (যেমন: '/blogs') বা সাবডোমেন সংকেত (যেমন: 'goto:library:')
  icon: string;  // Lucide Icon এর নাম (যেমন: 'BookOpen', 'Feather')
  desc?: string; // মেনুর বিবরণ
  color?: string;
  children?: MenuItem[]; // 👈 নেস্টেড ড্রপডাউন মেনুর জন্য MenuItem এর অ্যারে
}

export interface DomainConfig {
  siteName: string;   // সাইটের নাম (যেমন: "বঙ্কিম রচনাবলী")
  tagline: string;    // সাইটের ট্যাগলাইন বা স্লোগান
  logo: string;       // সাইটের সুনির্দিষ্ট লোগো ইমেজের পাথ (যেমন: "/logo/main.png")
  favicon: string;    // সাইটের ফেভিকন পাথ
  siteUrl: string;    // প্রোডাকশনে লাইভ সাবডোমেন/মেইন ইউআরএল (যেমন: "https://eduliture.org")
  bgColor: string;    // হেডারের ব্যাকগ্রাউন্ড কালার ক্লাস (যেমন: "bg-[#ffffff]")
  themeColor: 'teal' | 'emerald' | 'amber' | 'purple' | 'blue'; // সাবডোমেন থিম কালার
  menu: MenuItem[];   // সাবডোমেন ভিত্তিক কাস্টম মেনু অ্যারে
}

// প্রতিটি সাবডোমেনের সম্পূর্ণ ও সঠিক কনফিগারেশন ডাটাবেজ
export const headerConfig: Record<string, DomainConfig> = {
  // মেইন ডোমেন (eduliture.org)
  main: {
    siteName: "এডুলিচার",
    tagline: "বিশুদ্ধজ্ঞানের প্রত্যয়",
    logo: "/logo/logo.png",
    favicon: "/favicon/favicon.ico", 
    siteUrl: "https://eduliture.org",
    bgColor: "bg-[#ffffff]",
    themeColor: "teal",
    menu: [
      { label: "আলয়", url: "/", icon: "Home", desc: "প্রধান প্রবেশপথ" },
      { label: "এডুলিচার লাইব্রেরি", url: "goto:library:", icon: "Library", desc: "উন্মুক্ত গ্রন্থ সংগ্রহ" },
      { 
        label: "রচনাবলী প্রকল্প", 
        url: "#", 
        icon: "BookOpen", 
        desc: "সকল কালজয়ী রচনাবলী",
        children: [
          { label: "বিদ্যাসাগর রচনাবলী", url: "goto:vidyasagar:", icon: "BookMarked", desc: "ঈশ্বরচন্দ্র বিদ্যাসাগর রচিত সাহিত্য সংগ্রহ" },
          { label: "বঙ্কিম রচনাবলী", url: "goto:bankim:", icon: "BookMarked", desc: "বঙ্কিমচন্দ্র চট্টোপাধ্যায় রচিত সাহিত্য সংগ্রহ" },
          { label: "রবীন্দ্র রচনাবলী", url: "goto:rabindra:", icon: "BookMarked", desc: "রবীন্দ্রনাথ ঠাকুর রচিত সাহিত্য সংগ্রহ" },
          { label: "শরৎ রচনাবলী", url: "goto:sharat:", icon: "BookMarked", desc: "শরৎচন্দ্র চট্টোপাধ্যায় রচিত সাহিত্য সংগ্রহ" },
          { label: "নজরুল রচনাবলী", url: "goto:nazrul:", icon: "BookMarked", desc: "কাজী নজরুল ইসলাম রচিত সাহিত্য সংগ্রহ" },
          { label: "জীবনানন্দ রচনাবলী", url: "goto:jibanananda:", icon: "BookMarked", desc: "জীবনানন্দ দাশ রচিত সাহিত্য সংগ্রহ" }
        ]
      },
      { 
        label: "বিশুদ্ধজ্ঞান প্রকল্প", 
        url: "#", 
        icon: "Compass", 
        desc: "জ্ঞানভিত্তিক প্রজেক্টসমূহ",
        children: [
          { label: "এডুলিচার শব্দকোষ", url: "goto:shabdakosh:", icon: "Languages", desc: "বাঙলা ও বঙ্গীয় ভাষার শব্দকোষ" },
          { label: "কথামালা", url: "goto:story:", icon: "BookText", desc: "বাংলা গল্পের সমাহার" },
          { label: "এডুলিচার ইবুক", url: "goto:ebook:", icon: "FileText", desc: "ইপাব, পিডিএফ সংগ্রহ" },
          { label: "জেগে আছি", url: "goto:jegeachi:", icon: "Feather", desc: "সাহিত্যপত্র" }
        ]
      },
      { label: "সাহিত্যকথা", url: "/review", icon: "MessageSquare", desc: "সাহিত্য ও সাহিত্যিক সম্পর্কে রচনা" },
      { label: "পরিচয়", url: "/about", icon: "Info", desc: "এডুলিচার কী ও কেন?" }
    ]
  },

  // লাইব্রেরি সাবডোমেন (library.eduliture.org)
  library: {
    siteName: "এডুলিচার লাইব্রেরি",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/library.png",
    favicon: "/favicon/library.ico",
    siteUrl: "https://library.eduliture.org",
    bgColor: "bg-[#f4fbf7]", 
    themeColor: "emerald",
    menu: [
      { label: "আলয়", url: "goto:main:", icon: "Home", desc: "এডুলিচারের প্রধান প্রবেশক" },
      { label: "সব বই", url: "/books", icon: "BookOpen", desc: "লাইব্রেরির সর্বমোট বই সংগ্রহ" },
      { label: "বিভাগসমূহ", url: "/genres", icon: "Library", desc: "ক্যাটাগরি ভিত্তিক বইয়ের তালিকা" },
      { label: "প্রকল্প পরিচয়", url: "/about", icon: "Info", desc: "বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য", color: "gray" }
    ]
  },

  // বিদ্যাসাগর সাবডোমেন (vidyasagar.eduliture.org)
  vidyasagar: {
    siteName: "বিদ্যাসাগর রচনাবলী",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/vidyasagar.png",
    favicon: "/favicon/vidyasagar.ico",
    siteUrl: "https://vidyasagar.eduliture.org", // 👈 url টাইপো ঠিক করা হয়েছে
    bgColor: "bg-[#fffdf9]", 
    themeColor: "amber",
    menu: [
      { label: "হোম", url: "/", icon: "Home", desc: "বিদ্যাসাগর পাঠশালা" },
      { label: "অনুবাদ ও আখ্যান", url: "/genre/translations", icon: "BookOpen", desc: "অনুবাদ ও গল্প সাহিত্য", color: "blue" },
      { label: "শিক্ষা ও ব্যাকরণ", url: "/genre/education", icon: "Library", desc: "বর্ণপরিচয় ও সামাজিক গ্রন্থ", color: "orange" },
      { label: "সমাজসংস্কার ও প্রবন্ধ", url: "/genre/essays", icon: "History", desc: "বিধবা বিবাহ ও গবেষণা সাহিত্য", color: "purple" },
      { label: "চিঠিপত্র", url: "/genre/letters", icon: "Mail", desc: "পত্রাবলী ও ঐতিহাসিক নথি", color: "pink" },
      { label: "প্রকল্প পরিচয়", url: "/about", icon: "Info", desc: "বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য", color: "gray" }
    ]
  },

  // বঙ্কিম সাবডোমেন (bankim.eduliture.org)
  bankim: {
    siteName: "বঙ্কিম রচনাবলী",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/bankim.png",
    favicon: "/favicon/bankim.ico",
    siteUrl: "https://bankim.eduliture.org",
    bgColor: "bg-[#fffdf9]", 
    themeColor: "amber",
    menu: [
      { label: "উপন্যাস সমগ্র", url: "/genre/novel", icon: "BookOpen", desc: "বঙ্কিমচন্দ্রের কালজয়ী উপন্যাসসমূহ", color: "blue" },
      { label: "রম্য সাহিত্য", url: "/genre/humor", icon: "Feather", desc: "কমলাকান্তের দপ্তর ও রম্য রচনা", color: "teal" },
      { label: "ধর্মীয় সাহিত্য", url: "/genre/religious", icon: "Library", desc: "ধর্মতত্ত্ব ও কৃষ্ণচরিত্র বিষয়ক আলোচনা", color: "orange" },
      { label: "ইতিহাস ও প্রবন্ধ", url: "/genre/essays", icon: "History", desc: "ঐতিহাসিক ও বিবিধ গবেষণামূলক প্রবন্ধ", color: "purple" },
      { label: "পত্রাবলী", url: "/genre/letters", icon: "Mail", desc: "চিঠিপত্র ও দলিলাদি", color: "pink" },
      { label: "বিবিধ রচনা", url: "/genre/others", icon: "Archive", desc: "অগ্রন্থিত ও অপ্রকাশিত রচনাসংগ্রহ", color: "indigo" },
      { label: "প্রকল্প পরিচয়", url: "/about", icon: "Info", desc: "বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য", color: "gray" }
    ]
  },

  // রবীন্দ্রনাথ ঠাকুর আর্কাইভ সাবডোমেন (rabindra.eduliture.org)
  rabindra: {
    siteName: "রবীন্দ্রনাথ রচনাবলী",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/rabindra.png",
    favicon: "/favicon/rabindra.ico",
    siteUrl: "https://rabindra.eduliture.org",
    bgColor: "bg-[#fdfaff]", 
    themeColor: "purple",
    menu: [
      { label: "আলয়", url: "goto:main:", icon: "Home", desc: "প্রধান ওয়েবসাইট" },
      { label: "কবিতা সমগ্র", url: "/genre/poems", icon: "Feather", desc: "রবীন্দ্র কবিতা ও কাব্যগ্রন্থ" },
      { label: "ছোটগল্প", url: "/genre/stories", icon: "BookOpen", desc: "গল্পগুচ্ছ ও অন্যান্য গল্প" },
      { label: "উপন্যাস", url: "/genre/novels", icon: "BookMarked", desc: "চোখের বালি, গোরা ও অন্যান্য" },
      { label: "নাটক ও গান", url: "/genre/plays", icon: "Library", desc: "রবীন্দ্রসংগীত ও নৃত্যনাট্য" }
    ]
  },

  // শরৎ রচনাবলী সাবডোমেন (sharat.eduliture.org)
  sharat: {
    siteName: "শরৎ রচনাবলী",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/sharat.png",
    favicon: "/favicon/sharat.ico",
    siteUrl: "https://sharat.eduliture.org",
    bgColor: "bg-[#fdfaff]", 
    themeColor: "purple",
    menu: [
      { label: "আলয়", url: "goto:main:", icon: "Home", desc: "প্রধান ওয়েবসাইট" },
      { label: "উপন্যাস সমগ্র", url: "/genre/novels", icon: "BookOpen", desc: "দেবদাস, চরিত্রহীন ও অন্যান্য উপন্যাস" },
      { label: "ছোটগল্প", url: "/genre/stories", icon: "Feather", desc: "শরৎচন্দ্রের কালজয়ী গল্পসমূহ" },
      { label: "প্রবন্ধ", url: "/genre/essays", icon: "History", desc: "সমাজ ও সাহিত্য বিষয়ক প্রবন্ধ" }
    ]
  },

  // নজরুল সাবডোমেন (nazrul.eduliture.org)
  nazrul: {
    siteName: "নজরুল রচনাবলী",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/nazrul.png",
    favicon: "/favicon/nazrul.ico",
    siteUrl: "https://nazrul.eduliture.org",
    bgColor: "bg-[#fffdf9]", 
    themeColor: "amber",
    menu: [
      { label: "কবিতা ও কাব্য", url: "/genre/poetry", icon: "Feather", desc: "বিদ্রোহী, সঞ্চিতা ও অন্যান্য কাব্য", color: "blue" },
      { label: "সংগীত ও গজল", url: "/genre/music", icon: "Library", desc: "নজরুল গীতি ও ইসলামি গান", color: "teal" },
      { label: "উপন্যাস ও গল্প", url: "/genre/prose", icon: "BookOpen", desc: "বাঁধন হারা, মৃত্যক্ষুধা ও গল্পসমূহ", color: "purple" },
      { label: "অভিভাষণ ও প্রবন্ধ", url: "/genre/essays", icon: "History", desc: "রাজনৈতিক ও সামাজিক বক্তব্য", color: "orange" },
      { label: "প্রকল্প পরিচয়", url: "/about", icon: "Info", desc: "বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য", color: "gray" }
    ]
  },

  // জীবনানন্দ সাবডোমেন (jibanananda.eduliture.org)
  jibanananda: {
    siteName: "জীবনানন্দ রচনাবলী",
    tagline: "একটি এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প",
    logo: "/logo/jibanananda.png",
    favicon: "/favicon/jibanananda.ico",
    siteUrl: "https://jibanananda.eduliture.org",
    bgColor: "bg-[#fffdf9]", 
    themeColor: "amber",
    menu: [
      { label: "কবিতা সমগ্র", url: "/genre/poetry", icon: "Feather", desc: "রূপসী বাংলা, বনলতা সেন ও অন্যান্য", color: "blue" },
      { label: "উপন্যাস", url: "/genre/novels", icon: "BookOpen", desc: "মাল্যবান, সতীর্থ ও উপন্যাসসমূহ", color: "purple" },
      { label: "প্রবন্ধ ও আলোচনা", url: "/genre/essays", icon: "History", desc: "কাব্যকথা ও অন্যান্য সাহিত্য চিন্তা", color: "orange" },
      { label: "প্রকল্প পরিচয়", url: "/about", icon: "Info", desc: "বিশুদ্ধজ্ঞান প্রকল্পের লক্ষ্য ও উদ্দেশ্য", color: "gray" }
    ]
  }
};