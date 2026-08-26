export interface LibraryStatsResult {
    totalAuthors: number;
    totalBooks: number;
    totalSeries: number;
    totalItems: number;
}

/**
 * স্ট্রিপিং ও লোয়ারকেস করে টেক্সট নরম্যালাইজ করা
 */
const normalizeValue = (val: unknown): string => {
    if (val === null || val === undefined) return '';

    if (typeof val === 'object') {
        const obj = val as Record<string, unknown>;
        const strVal = String(obj.name || obj.title || obj.slug || obj.id || '').trim();
        if (strVal && strVal !== '[object Object]') {
            return strVal.toLowerCase().replace(/\s+/g, ' ');
        }
        return '';
    }

    const str = String(val).trim();
    if (!str || str === '[object Object]') return '';
    return str.toLowerCase().replace(/\s+/g, ' ');
};

/**
 * ফ্রন্টম্যাটার থেকে অ্যারে বা স্ট্রিং ভ্যালু সঠিকভাবে এক্সট্র্যাক্ট করা
 */
const extractValues = (item: Record<string, unknown>, keys: string[]): string[] => {
    const extracted: string[] = [];

    keys.forEach((key) => {
        const val = item[key];
        if (!val) return;

        if (Array.isArray(val)) {
            val.forEach((v) => {
                const norm = normalizeValue(v);
                if (norm) extracted.push(norm);
            });
        } else {
            const norm = normalizeValue(val);
            if (norm) extracted.push(norm);
        }
    });

    return extracted;
};

/**
 * লাইব্রেরির মূল পরিসংখ্যান গণনাকারী ফাংশন
 */
export function getLibraryStats(allBooksList: Record<string, unknown>[] = []): LibraryStatsResult {
    const authorSet = new Set<string>();
    const seriesSet = new Set<string>();
    const itemSet = new Set<string>();

    let indexBooksCount = 0;

    allBooksList.forEach((book) => {
        if (!book || typeof book !== 'object') return;

        const filePath = String(book.filePath || book.path || book.id || '');
        const isIndexFile = book.isIndex === true || filePath.endsWith('index.md');

        // ১. বই গণনাকারী (শুধুমাত্র মূল index.md ফাইলগুলোই ১টি করে বই)
        if (isIndexFile) {
            indexBooksCount++;
        }

        // ২. লেখক (Authors) গণনা (index.md ও সাব-ফাইল উভয় জায়গা থেকেই রিড করবে)
        extractValues(book, ['author', 'authors', 'writer']).forEach((a) => authorSet.add(a));

        // ৩. সিরিজ (Series) গণনা
        // ফ্রন্টম্যাটারে series ফিল্ড থেকে ইউনিক সিরিজ কালেকশন
        extractValues(book, ['series', 'seriesName', 'bookSeries']).forEach((s) => seriesSet.add(s));

        // ৪. প্রকরণ (Items / Types) গণনা
        // ফাইল সংখ্যা নয়, বরং 'item', 'items', 'type', 'category' ফিল্ডের ইউনিক নাম (যেমন: কবিতা, প্রবন্ধ) গণনা
        extractValues(book, ['item', 'items', 'itemType', 'type', 'category']).forEach((i) => itemSet.add(i));
    });

    return {
        totalAuthors: authorSet.size,
        totalBooks: indexBooksCount || allBooksList.length,
        totalSeries: seriesSet.size,
        totalItems: itemSet.size,
    };
}