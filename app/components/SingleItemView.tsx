import type { FC } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, User } from 'lucide-react';

interface SingleItemViewProps {
    item: any;
    prevItem?: any;
    nextItem?: any;
}

const extractText = (val: any, fallback: string = '—'): string => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val.name || val.title || fallback;
    return fallback;
};

const getItemHref = (itemObj: any): string => {
    if (!itemObj) return '#';
    const slug = itemObj.slug || extractText(itemObj.title, '');
    return `/items/${encodeURIComponent(slug)}`;
};

export const SingleItemView: FC<SingleItemViewProps> = ({ item, prevItem, nextItem }) => {
    const titleText = extractText(item.title, 'শিরোনামহীন');
    const authorText = extractText(item.author, 'অজানা লেখক');
    const bookText = extractText(item.bookTitle || item.book, '');

    return (
        <article className="max-w-4xl mx-auto px-4 py-8 font-tarunima space-y-8">
            {/* 🟢 আইটেম হেডার */}
            <header className="space-y-3 border-b border-teal-100 pb-6 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-[#008080] leading-tight">
                    {titleText}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600 pt-2">
                    {authorText && (
                        <div className="flex items-center gap-1.5">
                            <User size={16} className="text-[#008080]" />
                            <span>{authorText}</span>
                        </div>
                    )}

                    {bookText && (
                        <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                            <BookOpen size={16} className="text-[#cc7a00]" />
                            <span>মূল গ্রন্থ: {bookText}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* 🟢 সিঙ্গেল আইটেমের মূল কন্টেন্ট */}
            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-800 leading-relaxed min-h-[250px] p-6 bg-white/80 rounded-2xl border border-teal-50 shadow-xs">
                {item.content ? (
                    <div dangerouslySetInnerHTML={{ __html: item.content }} />
                ) : (
                    <p className="whitespace-pre-line text-lg">{item.body || item.text || 'আইটেমের কন্টেন্ট লোড করা হচ্ছে...'}</p>
                )}
            </div>

            {/* 🟢 আইটেম-টু-আইটেম নেভিগেশন বার (শুধু এক আইটেম থেকে অন্য আইটেমে যাবে) */}
            <nav aria-label="আইটেম নেভিগেশন" className="pt-6 border-t border-teal-100">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* পূর্ববর্তী আইটেম */}
                    {prevItem ? (
                        <Link
                            href={getItemHref(prevItem)}
                            className="flex items-center gap-2 p-3 rounded-xl border border-teal-100 bg-white hover:bg-teal-50 text-[#008080] transition-all w-full sm:w-auto max-w-xs group shadow-2xs"
                        >
                            <ArrowLeft className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
                            <div className="min-w-0 text-left">
                                <span className="block text-xs text-gray-600">পূর্ববর্তী আইটেম</span>
                                <span className="font-semibold text-sm truncate block">
                                    {extractText(prevItem.title)}
                                </span>
                            </div>
                        </Link>
                    ) : (
                        <div className="hidden sm:block" />
                    )}

                    {/* পরবর্তী আইটেম */}
                    {nextItem ? (
                        <Link
                            href={getItemHref(nextItem)}
                            className="flex items-center justify-end gap-2 p-3 rounded-xl border border-teal-100 bg-white hover:bg-teal-50 text-[#008080] transition-all w-full sm:w-auto max-w-xs text-right group shadow-2xs ml-auto"
                        >
                            <div className="min-w-0 text-right">
                                <span className="block text-xs text-gray-600">পরবর্তী আইটেম</span>
                                <span className="font-semibold text-sm truncate block">
                                    {extractText(nextItem.title)}
                                </span>
                            </div>
                            <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <div className="hidden sm:block" />
                    )}
                </div>
            </nav>
        </article>
    );
};

export default SingleItemView;