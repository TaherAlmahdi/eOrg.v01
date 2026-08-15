export interface SiteConfig {
  title: string;
  image: string;
  description?: string; // 🔹 বর্ণনা যুক্ত করা হলো
}

export const siteMap: Record<string, SiteConfig> = {
  library: {
    title: 'এডুলিচার পাঠশালা',
    image: 'library.jpg',
    description: 'নতুন প্রকাশিত বই, লেখক এবং বিভিন্ন ঘরানার সমৃদ্ধ অনলাইন সংগ্রহশালার পাঠশালা।',
  },
  vidyasagar: {
    title: 'বিদ্যাসাগর রচনাবলী',
    image: 'bankim.jpg',
    description: 'ঈশ্বরচন্দ্র বিদ্যাসাগরের সমগ্র সাহিত্যকর্ম, প্রবন্ধ ও শিক্ষামূলক রচনা সংগ্রহ।',
  },
  bankim: {
    title: 'বঙ্কিম রচনাবলী',
    image: 'bankim.jpg',
    description: 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়ের কালজয়ী উপন্যাস, প্রবন্ধ ও সাহিত্য সম্ভার।',
  },
  rabindra: {
    title: 'রবীন্দ্র রচনাবলী',
    image: 'tagore.jpg',
    description: 'রবীন্দ্রনাথ ঠাকুরের সমগ্র কবিতা, ছোটগল্প, নাটক ও উপন্যাস সংগ্রহ।',
  },
  sarat: {
    title: 'শরৎ রচনাবলী',
    image: 'bankim.jpg',
    description: 'শরৎচন্দ্র চট্টোপাধ্যায়ের সকল জনপ্রিয় উপন্যাস ও গল্প সংগ্রহ।',
  },
  nazrul: {
    title: 'নজরুল রচনাবলী',
    image: 'nazrul.jpg',
    description: 'কাজী নজরুল ইসলামের কবিতা, গান, উপন্যাস ও প্রবন্ধ সম্ভার।',
  },
  jibanananda: {
    title: 'জীবনানন্দ রচনাবলী',
    image: 'bankim.jpg',
    description: 'জীবনানন্দ দাশের রূপসী বাংলা ও রূপময় কাব্যগ্রন্থ ও সাহিত্যিক সংগ্রহ।',
  },
};

export interface SubdomainData {
  title: string;
  ogImage: string;
  subdomain: string;
  description?: string; // 🔹 SubdomainData ইন্টারফেসে description ফিল্ড
}

export function getSubdomainData(host: string | null): SubdomainData {
  const mainDomainTitle = 'এডুলিচার';
  const defaultTitle = 'বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান';
  const defaultImage = 'default.png';
  const defaultDescription = 'শিক্ষা, সাহিত্য ও সংস্কৃতি বিষয়ক বিশুদ্ধজ্ঞান প্ল্যাটফর্ম।';

  if (!host) {
    return {
      title: `${defaultTitle} ❀ ${mainDomainTitle}`,
      ogImage: `/og/site/${defaultImage}`,
      subdomain: '',
      description: defaultDescription,
    };
  }

  let subdomain = '';
  const hostWithoutPort = host.split(':')[0];
  
  if (hostWithoutPort.endsWith('.localhost')) {
    subdomain = hostWithoutPort.replace('.localhost', '').toLowerCase();
  } else {
    const parts = hostWithoutPort.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      subdomain = parts[0].toLowerCase();
    }
  }

  if (subdomain && siteMap[subdomain]) {
    const site = siteMap[subdomain];
    return {
      title: `${site.title}`,
      ogImage: `/og/site/${site.image}`,
      subdomain,
      description: site.description || defaultDescription,
    };
  }

  if (subdomain && subdomain !== 'localhost') {
    const formattedName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
    return {
      title: `${formattedName} ❀ ${mainDomainTitle}`,
      ogImage: `/og/site/${subdomain}.jpg`,
      subdomain,
      description: `${formattedName} - ${defaultDescription}`,
    };
  }

  return {
    title: `${defaultTitle} ❀ ${mainDomainTitle}`,
    ogImage: `/og/site/${defaultImage}`,
    subdomain: '',
    description: defaultDescription,
  };
}

interface DynamicTitleOptions {
  metaTitle?: string | null;
  currentPageTitle?: string | null;
  volumePageTitle?: string | null;
  bookTitle?: string | null;
  siteName?: string | null;
  tagline?: string | null;          // 🔹 নতুন ফিল্ড
  mainDomainTitle?: string | null;  // 🔹 নতুন ফিল্ড
}

export function buildTabTitle({
  metaTitle,
  currentPageTitle,
  volumePageTitle,
  bookTitle,
  siteName,
  tagline,
  mainDomainTitle,
}: DynamicTitleOptions): string {
  if (metaTitle) {
    return metaTitle;
  }

  const titleParts = [
    currentPageTitle,
    volumePageTitle,
    bookTitle,
    siteName,
    tagline,
    mainDomainTitle,
  ].filter(Boolean);

  return titleParts.join(' ❀ ');
}