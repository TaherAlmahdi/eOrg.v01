'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, User, Tag, ArrowLeft, Share2, Calendar } from 'lucide-react';

export interface SingleItemData {
    slug: string;
    title: string;
    subtitle?: string;
    author?: string;
    authorSlug?: string;
    bookTitle?: string;
    bookSlug?: string;
    itemType?: string;
    itemTypeSlug?: string;
    href?: string;
    translator?: string;
    editor?: string;
    content: string;
    cover_image?: string;
    rawFrontmatter?: Record<string, any>;
    [key: string]: any;
}

interface SingleItemViewProps {
    item: SingleItemData;
    content?: string;
    frontmatter?: Record<string, any>;
}

export default function SingleItemView({ item, content, frontmatter }: SingleItemViewProps) {
    // কন্টেন্ট পার্সিং ফলব্যাক (যদি আলাদা কন্টেন্ট পাস করা হয় অথবা আইটেমের ভেতরে থাকে)
    const articleContent = content || item.content || '';
    const itemTypeLabel = item.itemType || frontmatter?.item || frontmatter?.type || 'লেখা';
    const authorName = item.author || frontmatter?.author || 'অজ্ঞাত লেখক';
    const bookName = item.bookTitle || frontmatter?.bookTitle || frontmatter?.book;

    // শেয়ার হ্যান্ডলার
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `${item.title} - ${authorName}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Sharing failed', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('লিংক কপি করা হয়েছে!');
        }
    };

    return (
        <article className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {/* ১. শীর্ষ নেভিগেশন ও ব্যাক বাটন */}
            <nav className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200 dark:border-stone-800">
                {item.bookSlug ? (
                    <Link
                        href={`/books/${item.bookSlug}`}
                        className="inline-flex items-center text-sm text-stone-600 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        <span>{bookName || 'মূল বইয়ে ফিরে যান'}</span>
                    </Link>
                ) : (
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-stone-600 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        <span>প্রচ্ছদে ফিরে যান</span>
                    </Link>
                )}

                <button
                    onClick={handleShare}
                    className="p-2 text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-400 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    title="শেয়ার করুন"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </nav>

            {/* ২. আইটেম হেডার / মেটা তথ্য */}
            <header className="text-center mb-10 space-y-4">
                {/* আইটেম টাইপ ব্যাজ */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    <Tag className="w-3 h-3" />
                    <span>{itemTypeLabel}</span>
                </div>

                {/* মূল শিরোনাম */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 leading-tight font-serif">
                    {item.title}
                </h1>

                {/* উপশিরোনাম (যদি থাকে) */}
                {item.subtitle && (
                    <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 font-serif italic">
                        {item.subtitle}
                    </p>
                )}

                {/* লেখক ও বইয়ের তথ্য */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-stone-600 dark:text-stone-400 pt-2">
                    {item.author && (
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                            {item.authorSlug ? (
                                <Link
                                    href={`/author/${item.authorSlug}`}
                                    className="hover:underline font-medium text-stone-800 dark:text-stone-200"
                                >
                                    {authorName}
                                </Link>
                            ) : (
                                <span className="font-medium text-stone-800 dark:text-stone-200">{authorName}</span>
                            )}
                        </div>
                    )}

                    {bookName && (
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                            <span>গ্রন্থ: <strong className="font-medium text-stone-800 dark:text-stone-200">{bookName}</strong></span>
                        </div>
                    )}

                    {item.translator && (
                        <div className="text-xs text-stone-500 dark:text-stone-500">
                            (অনুবাদ: {item.translator})
                        </div>
                    )}
                </div>
            </header>

            {/* ৩. প্রচ্ছদ ছবি (যদি থাকে) */}
            {item.cover_image && (
                <div className="mb-10 text-center">
                    <img
                        src={item.cover_image}
                        alt={item.title}
                        className="max-h-96 mx-auto rounded-lg shadow-md object-cover"
                    />
                </div>
            )}

            {/* ৪. মূল বিষয়বস্তু (কন্টেন্ট রেন্ডারার) */}
            <section className="prose prose-stone dark:prose-invert max-w-none text-lg leading-relaxed font-serif pt-4 border-t border-stone-100 dark:border-stone-900">
                {/* যদি আপনার কন্টেন্ট মাকডাউন থেকে প্রসেস হয়ে প্লেইন টেক্সট বা নিউ-লাইন স্ট্রিং হিসেবে আসে */}
                <div className="whitespace-pre-line space-y-4 text-stone-800 dark:text-stone-200">
                    {articleContent}
                </div>
            </section>

            {/* ৫. ফুটার নোটিশ */}
            <footer className="mt-16 pt-6 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-500">
                <p>এডুলিচার বিশুদ্ধজ্ঞান প্রকল্প ❀ ডিজিটাল আর্কাইভ</p>
            </footer>
        </article>
    );
}