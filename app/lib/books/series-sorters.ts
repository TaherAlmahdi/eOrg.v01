// app/lib/books/series-sorters.ts

/**
 * নির্দিষ্ট বই থেকে সিরিজ অর্ডারের মান বের করার হেল্পার
 */
function extractSeriesOrder(book: Record<string, any>, seriesName?: string): string | null {
  // ১. seriesList অ্যারে থাকলে এবং সিরিজের নাম মিললে তার order নেওয়া
  if (seriesName && Array.isArray(book.seriesList)) {
    const matched = book.seriesList.find(
      (s: any) => s?.name && String(s.name).trim().toLowerCase() === seriesName.trim().toLowerCase()
    );
    if (matched && matched.order !== undefined && matched.order !== null && matched.order !== '') {
      return String(matched.order).trim();
    }
  }

  // ২. টপ লেভেল series_order ফিল্ড চেক
  const rawOrder = book.series_order ?? book.seriesOrder ?? book.sort_order ?? book.sortOrder;
  if (rawOrder !== undefined && rawOrder !== null && rawOrder !== '') {
    return String(rawOrder).trim();
  }

  return null;
}

/**
 * বই থেকে প্রকাশের সাল/তারিখ বের করার হেল্পার
 */
function extractFirstPublished(book: Record<string, any>): string | null {
  const rawPub = book.first_published ?? book.published ?? book.publishDate ?? book.pub_year;
  if (rawPub !== undefined && rawPub !== null && rawPub !== '') {
    return String(rawPub).trim();
  }
  return null;
}

/**
 * সিরিজের বইগুলোকে সর্ট করার প্রধান লজিক:
 * ধাপ ১: series_order (যদি সব বইয়ে থাকে)
 * ধাপ ২: first_published (যদি সব বইয়ে থাকে)
 * ধাপ ৩: title (বাংলা বর্ণানুক্রমিক ফলব্যাক)
 */
export function sortSeriesBooks<T extends Record<string, any>>(books: T[], seriesName?: string): T[] {
  if (!books || books.length <= 1) return books;

  // ধাপ ১: সিরিজের "সবগুলো" বইয়ে series_order আছে কি না
  const hasAllSeriesOrder = books.every((book) => extractSeriesOrder(book, seriesName) !== null);

  if (hasAllSeriesOrder) {
    return [...books].sort((a, b) => {
      const orderA = extractSeriesOrder(a, seriesName) || '';
      const orderB = extractSeriesOrder(b, seriesName) || '';
      return orderA.localeCompare(orderB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  // ধাপ ২: যেকোনো একটিতে series_order না থাকলে, "সবগুলো" বইয়ে first_published আছে কি না
  const hasAllFirstPublished = books.every((book) => extractFirstPublished(book) !== null);

  if (hasAllFirstPublished) {
    return [...books].sort((a, b) => {
      const pubA = extractFirstPublished(a) || '';
      const pubB = extractFirstPublished(b) || '';
      return pubA.localeCompare(pubB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }

  // ধাপ ৩: প্রথম দুই ধাপ না মিললে বাংলা বর্ণানুক্রমিক (Title) সর্ট
  return [...books].sort((a, b) => {
    const titleA = String(a.title || '').trim();
    const titleB = String(b.title || '').trim();
    return titleA.localeCompare(titleB, 'bn', { sensitivity: 'base' });
  });
}

/**
 * ম্যাপের অন্তর্গত প্রতিটি সিরিজের জন্য সর্টিং কল করার হেল্পার
 */
export function sortAllSeriesMap<T extends Record<string, any>>(
  booksBySeries: Record<string, T[]>
): Record<string, T[]> {
  const sortedMap: Record<string, T[]> = {};

  for (const sName in booksBySeries) {
    if (Object.prototype.hasOwnProperty.call(booksBySeries, sName)) {
      sortedMap[sName] = sortSeriesBooks(booksBySeries[sName], sName);
    }
  }

  return sortedMap;
}