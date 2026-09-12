const MEDIA_BASE_URL = 'https://media.eduliture.org';

export function getCoverImageUrl(coverPath?: string | null): string {
    // ১. কোনো পাথ না থাকলে ডিফল্ট ইমেজ
    if (!coverPath) return '/cover/default-cover.webp';

    // ২. যদি ইতোমধ্যে সম্পূর্ণ URL (http/https) হয়ে থাকে
    if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) {
        return coverPath;
    }

    // ৩. শুরুর স্ল্যাশ (/) কেটে পরিচ্ছন্ন পাথ নেওয়া
    const cleanPath = coverPath.startsWith('/') ? coverPath.slice(1) : coverPath;

    // ৪. সরাসরি R2 Media URL এর সাথে পাথ যুক্ত করা
    return `${MEDIA_BASE_URL}/${cleanPath}`;
}