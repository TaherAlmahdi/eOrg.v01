// app/lib/books/index.ts

// ১. মূল টাইপস
export * from './types';

// ২. এক্সট্রাক্টরস
export * from './extractors';

// ৩. হাইরারকি ও বুক ডিটেইলস
export * from './hierarchy';
export * from './book-details';

// ৪. ইউটিলিটিজ (ডুপ্লিকেট এক্সপোর্ট ছাড়া)
export {
    sortSeriesBooks,
    slugify,
    // extractors বা অন্যান্য ফাইলে থাকা ডুপ্লিকেট ফাংশনগুলো এখান থেকে বাদ দেওয়া হয়েছে
} from './utils';

// ৫. ফেচার্স
export {
    getLibraryBooks,
    // book-details-এ getBookBySlug থাকলে এখান থেকে এক্সপোর্ট করার প্রয়োজন নেই
} from './fetchers';