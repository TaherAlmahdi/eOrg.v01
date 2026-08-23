// app/lib/build-tab-title.ts

/**
 * সাধারণ পেজের জন্য অপশনস (হোমপেজ, অ্যাবাউট, বায়োগ্রাফি ইত্যাদি)
 */
export interface StandardTitleOptions {
  pageType?: 'home' | 'standard';
  currentPageTitle?: string;
  metaTitle?: string;
  siteName?: string; // e.g. "এডুলিচার" বা "বঙ্কিমচন্দ্র"
  siteTag?: string;  // e.g. "বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান"
  separator?: string; // ডিফল্ট '❀'
}

/**
 * বইয়ের পেজের জন্য বিশেষ অপশনস (এমডি ফাইলের ফ্রন্টম্যাটার থেকে)
 */
export interface BookTitleOptions {
  pageType: 'book';
  pageTitle?: string;      // পাতার নাম / অধ্যায়ের নাম (title: "...")
  chapterTitle?: string;   // যদি আলাদা চ্যাপ্টার টাইটেল থাকে
  volumeTitle?: string;    // যদি ভলিউম/খণ্ড থাকে (e.g. "প্রথম খণ্ড")
  bookTitle: string;       // মূল বইয়ের নাম (e.g. "দুর্গেশনন্দিনী" বা "ইন্দিরা")
  metaTitle?: string;      // ম্যানুয়ালি মেটা টাইটেল ওভাররাইড করতে চাইলে
  separator?: string;      // ডিফল্ট '❀'
}

export type BuildTitleOptions = StandardTitleOptions | BookTitleOptions;

/**
 * প্রতিটি পেজের জন্য নির্দিষ্ট নিডস অনুযায়ী ডায়নামিক ট্যাব টাইটেল জেনারেটর
 */
export function buildTabTitle(options: BuildTitleOptions): string {
  // ০. যদি মেটা টাইটেল (metaTitle) সরাসরি নির্দিষ্ট করে দেওয়া থাকে, তবে সেটিই প্রথম প্রাধান্য পাবে
  if (options.metaTitle && options.metaTitle.trim() !== '') {
    return options.metaTitle.trim();
  }

  // গ্লোবাল সেপারেটর সেট করা (ডিফল্ট '❀')
  const separator = options.separator?.trim() || '❀';

  // -------------------------------------------------------------
  // কেস ১: বইয়ের পেজগুলোর জন্য (Book Pages)
  // ফরম্যাট: {pageTitle} ❀ {chapterTitle} ❀ {volumeTitle} ❀ {bookTitle}
  // -------------------------------------------------------------
  if (options.pageType === 'book') {
    const { pageTitle, chapterTitle, volumeTitle, bookTitle } = options;

    const bookParts: string[] = [];

    // ১. পেজ বা পাতার টাইটেল
    if (pageTitle && pageTitle.trim() !== '') {
      bookParts.push(pageTitle.trim());
    }

    // ২. চ্যাপ্টার টাইটেল (যদি পেজ টাইটেল থেকে আলাদা হয়)
    if (chapterTitle && chapterTitle.trim() !== '' && chapterTitle !== pageTitle) {
      bookParts.push(chapterTitle.trim());
    }

    // ৩. ভলিউম/খণ্ড (যদি থাকে)
    if (volumeTitle && volumeTitle.trim() !== '') {
      bookParts.push(volumeTitle.trim());
    }

    // ৪. মূল বইয়ের নাম (বাধ্যতামূলক)
    if (bookTitle && bookTitle.trim() !== '') {
      bookParts.push(bookTitle.trim());
    }

    // ফাঁকা ফিল্ডগুলো বাদ দিয়ে কাস্টম সেপারেটর দিয়ে যুক্ত করা
    return bookParts.filter(Boolean).join(` ${separator} `);
  }

  // -------------------------------------------------------------
  // কেস ২: সাইটের হোমপেজ (Main or Subdomain Home)
  // ফরম্যাট: {SiteTitle} ❀ {SiteTag}
  // -------------------------------------------------------------
  const {
    pageType = 'standard',
    currentPageTitle,
    siteName = 'এডুলিচার',
    siteTag,
  } = options as StandardTitleOptions;

  if (pageType === 'home') {
    if (siteTag && siteTag.trim() !== '') {
      return `${siteName.trim()} ${separator} ${siteTag.trim()}`;
    }
    return siteName.trim();
  }

  // -------------------------------------------------------------
  // কেস ৩: সাধারণ পেজ, অ্যাবাউট, বায়োগ্রাফি ইত্যাদি (Main and Subdomain Pages)
  // ফরম্যাট: {pageTitle} ❀ {siteName}
  // -------------------------------------------------------------
  if (currentPageTitle && currentPageTitle.trim() !== '') {
    return `${currentPageTitle.trim()} ${separator} ${siteName.trim()}`;
  }

  // ফলব্যাক হিসেবে শুধু সাইটের নাম
  return siteName.trim();
}