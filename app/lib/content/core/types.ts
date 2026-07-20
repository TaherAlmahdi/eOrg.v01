// app/lib/content/core/types.ts

import type { LoadedDocument } from "./loader";

export interface BaseContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  document: LoadedDocument;
}

export interface StaticPage extends BaseContent {}

export interface LiteratureBook extends BaseContent {
  volume?: string;
  chapter?: string;
  
  // কন্টেন্ট ডেটা ও স্ল্যাগ
  author: string;
  authorSlug: string;
  genre: string;
  genreSlug: string;
  tags: string[];
  tagSlugs: string[];
  subdomains: string[];
  draft: boolean;

  // সেন্ট্রাল রেজিস্ট্রি থেকে আসা খাঁটি বাংলা পরিভাষা (UI-তে দেখানোর জন্য)
  authorLabel: string; // যেমন: "লেখক"
  genreLabel: string;  // যেমন: "সাহিত্যরূপ"
  tagsLabel: string;   // যেমন: "বিষয়শ্রেণী"
}