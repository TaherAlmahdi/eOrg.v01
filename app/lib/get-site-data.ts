export const siteMap: Record<string, { title: string; image: string }> = {
  library: {
    title: 'এডুলিচার পাঠশালা',
    image: 'library.jpg',
  },
  vidyasagar: {
    title: 'বিদ্যাসাগর রচনাবলী',
    image: 'bankim.jpg',
  },
  bankim: {
    title: 'বঙ্কিম রচনাবলী',
    image: 'bankim.jpg',
  },
  rabindra: {
    title: 'রবীন্দ্র রচনাবলী',
    image: 'tagore.jpg',
  },
  sarat: {
    title: 'শরৎ রচনাবলী',
    image: 'bankim.jpg',
  },
  nazrul: {
    title: 'নজরুল রচনাবলী',
    image: 'nazrul.jpg',
  },
  jibanananda: {
    title: 'জীবনানন্দ রচনাবলী',
    image: 'bankim.jpg',
  },
};

export function getSubdomainData(host: string | null) {
  const mainDomainTitle = 'এডুলিচার';
  const defaultTitle = 'বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান';
  const defaultImage = 'default.png';

  if (!host) {
    return {
      title: `${defaultTitle} ❀ ${mainDomainTitle}`,
      ogImage: `/og/site/${defaultImage}`,
      subdomain: '',
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
    };
  }

  if (subdomain && subdomain !== 'localhost') {
    const formattedName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
    return {
      title: `${formattedName} ❀ ${mainDomainTitle}`,
      ogImage: `/og/site/${subdomain}.jpg`,
      subdomain,
    };
  }

  return {
    title: `${defaultTitle} ❀ ${mainDomainTitle}`,
    ogImage: `/og/site/${defaultImage}`,
    subdomain: '',
  };
}

interface DynamicTitleOptions {
  metaTitle?: string | null;
  currentPageTitle?: string | null;
  volumePageTitle?: string | null;
  bookTitle?: string | null;
  siteName?: string | null;
}

export function buildTabTitle({
  metaTitle,
  currentPageTitle,
  volumePageTitle,
  bookTitle,
  siteName,
}: DynamicTitleOptions): string {
  if (metaTitle) {
    return metaTitle;
  }

  const titleParts = [
    currentPageTitle,
    volumePageTitle,
    bookTitle,
    siteName,
  ].filter(Boolean);

  return titleParts.join(' ❀ ');
}