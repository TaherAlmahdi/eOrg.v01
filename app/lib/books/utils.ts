import path from 'path';

export const booksDirectory = path.resolve(process.cwd(), 'content', 'books');

/**
 * আলফানিউমেরিক বা প্রাকৃতিক ক্রমানুসারে ফাইল/ফোল্ডার সর্টিং
 */
export const naturalSort = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

/**
 * ইংরেজি সংখ্যা পার্স করার হেল্পার
 */
export function parseNumericOrder(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseFloat(String(value).trim());
  return isNaN(parsed) ? null : parsed;
}

/**
 * যেকোনো স্ট্রিংকে স্লাগে রূপান্তর করার হেল্পার (বাংলা অক্ষরের পূর্ণ সাপোর্টসহ)
 */
export function slugify(text: string): string {
  if (!text) return '';
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0980-\u09FF\-]/g, '')
    .replace(/-+/g, '-');
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

/**
 * সিরিজের বইগুলোকে series_order -> first_published -> title (বাংলা বর্ণানুক্রম) অনুযায়ী সর্ট করার প্রধান লজিক
 */
export function sortSeriesBooks<T extends Record<string, any>>(books: T[]): T[] {
  if (!books || books.length <= 1) return books;

  // ১. চেক: সিরিজের "সবগুলো" বইয়ে বৈধ series_order আছে কি না
  const hasAllSeriesOrder = books.every((book) => {
    const rawOrder = book.series_order ?? book.seriesOrder ?? book.sort_order ?? book.sortOrder;
    return parseNumericOrder(rawOrder) !== null;
  });

  if (hasAllSeriesOrder) {
    return [...books].sort((a, b) => {
      const rawA = a.series_order ?? a.seriesOrder ?? a.sort_order ?? a.sortOrder;
      const rawB = b.series_order ?? b.seriesOrder ?? b.sort_order ?? b.sortOrder;
      return (parseNumericOrder(rawA) ?? 0) - (parseNumericOrder(rawB) ?? 0);
    });
  }

  // ২. চেক: সবগুলো বইয়ে series_order না থাকলে, "সবগুলো" বইয়ে first_published সাল আছে কি না
  const hasAllFirstPublished = books.every((book) => {
    const rawPub = book.first_published ?? book.published ?? book.pub_year;
    return parseNumericOrder(rawPub) !== null;
  });

  if (hasAllFirstPublished) {
    return [...books].sort((a, b) => {
      const rawA = a.first_published ?? a.published ?? a.pub_year;
      const rawB = b.first_published ?? b.published ?? b.pub_year;
      return (parseNumericOrder(rawA) ?? 0) - (parseNumericOrder(rawB) ?? 0);
    });
  }

  // ৩. কোনো তথ্য অনুপস্থিত থাকলে স্বয়ংসক্রিয়ভাবে বাংলা বর্ণানুক্রমিক সর্টে ফলব্যাক করবে
  return [...books].sort((a, b) => {
    const titleA = String(a.title || '').trim();
    const titleB = String(b.title || '').trim();
    return titleA.localeCompare(titleB, 'bn');
  });
}