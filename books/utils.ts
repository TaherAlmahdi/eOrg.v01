import path from 'path';

export const booksDirectory = path.resolve(process.cwd(), 'content', 'books');

/**
 * আলফানিউমেরিক বা প্রাকৃতিক ক্রমানুসারে ফাইল/ফোল্ডার সর্টিং
 */
export const naturalSort = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/**
 * বাংলা ডিজিটকে ইংরেজি ডিজিটে রূপান্তর করার হেল্পার
 */
export function parseNumericOrder(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let strVal = String(value).trim();
  
  // বাংলা সংখ্যাকে ইংরেজিতে রূপান্তর
  for (let i = 0; i < 10; i++) {
    strVal = strVal.replace(new RegExp(banglaDigits[i], 'g'), String(i));
  }
  
  const parsed = parseFloat(strVal);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * যেকোনো স্ট্রিংকে স্লাগে রূপান্তর করার হেল্পার (বাংলা অক্ষরের পূর্ণ সাপোর্টসহ)
 */
export function slugify(text: string): string {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // স্পেস হাইফেন হবে
    .replace(/[^\w\u0980-\u09FF\-]/g, '') // বাংলা, ইংরেজি অক্ষরের বাইরের ক্যারেক্টার বাদ
    .replace(/-+/g, '-'); // একাধিক হাইফেন একটা করবে
}

/**
 * স্ট্রিম/স্ট্রিং থেকে সাবডোমেন অ্যারে বের করার হেল্পার
 */
export function parseSubdomains(subdomainRaw: unknown, defaultAuthorFolder: string): string[] {
  if (!subdomainRaw) return [defaultAuthorFolder, 'library'];

  if (Array.isArray(subdomainRaw)) {
    return subdomainRaw.map((s) => String(s).trim().toLowerCase());
  }

  if (typeof subdomainRaw === 'string') {
    return subdomainRaw.split(',').map((s) => s.trim().toLowerCase());
  }

  return [defaultAuthorFolder, 'library'];
}