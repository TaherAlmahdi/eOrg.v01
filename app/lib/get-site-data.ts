// app/lib/get-site-data.ts

// সাবডোমেন অনুযায়ী বিষয়টির নাম এবং ওজি ইমেজের ফাইল নেম ম্যাপিং
const siteMap: Record<string, { title: string; image: string }> = {
  bankim: {
    title: 'বঙ্কিম রচনাবলী',
    image: 'bankim.jpg', // public/og/site/bankim.jpg
  },
  nazrul: {
    title: 'নজরুল রচনাবলী',
    image: 'nazrul.jpg',
  },
  tagore: {
    title: 'রবীন্দ্র রচনাবলী',
    image: 'tagore.jpg',
  },
  library: {
    title: 'পাঠশালা',
    image: 'library.jpg',
  },
  // প্রয়োজন অনুযায়ী নতুন সাবডোমেন যুক্ত করুন
};

export function getSubdomainData(host: string | null) {
  const mainDomainTitle = 'এডুলিচার';
  const defaultTitle = 'বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান';
  const defaultImage = 'default.png';

  if (!host) {
    return {
      title: `${defaultTitle} ❀ ${mainDomainTitle}`,
      ogImage: `/og/site/${defaultImage}`,
      subdomain: '',
    };
  }

  // host থেকে সাবডোমেন আলাদা করা (e.g., bankim.eduliture.com -> bankim)
  const parts = host.split('.');
  
  // localhost বা মূল ডোমেনের বাইরে কাস্টম সাবডোমেন চেক
  let subdomain = '';
  if (parts.length > 2 && parts[0] !== 'www') {
    subdomain = parts[0].toLowerCase();
  
  } else if (host.includes('library.localhost')) {
    subdomain = 'library';
  
  } else if (host.includes('bankim.localhost')) {
    subdomain = 'bankim';
  
  } else if (host.includes('nazrul.localhost')) {
    subdomain = 'nazrul';
  }
  // ১. সাবডোমেন যদি siteMap এ সংজ্ঞায়িত থাকে
  if (subdomain && siteMap[subdomain]) {
    const site = siteMap[subdomain];
    return {
      title: `${site.title} ❀ ${mainDomainTitle}`, // যেমন: বঙ্কিম রচনাবলী ❀ এডুলিচার
      ogImage: `/og/site/${site.image}`,
      subdomain,
    };
  }

  // ২. সাবডোমেন পাওয়া গেছে কিন্তু siteMap এ ম্যানুয়ালি যুক্ত করা নেই (ডাইনামিক ফ্যালব্যাক)
  if (subdomain) {
    const formattedName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
    return {
      title: `${formattedName} ❀ ${mainDomainTitle}`, // যেমন: Library ❀ এডুলিচার
      ogImage: `/og/site/${subdomain}.jpg`, // অটোমেটিক /og/site/[subdomain].jpg খুঁজবে
      subdomain,
    };
  }

  // ৩. মূল ডোমেনের জন্য (যেমন: eduliture.com)
  return {
    title: `${defaultTitle} ❀ ${mainDomainTitle}`,
    ogImage: `/og/site/${defaultImage}`,
    subdomain: '',
  };
}