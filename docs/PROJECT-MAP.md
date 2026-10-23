# eOrg — প্রজেক্ট মানচিত্র (ফেজ ০, ২০২৬-১০-২০)

## ১. fs / process.cwd() ব্যবহার (রানটাইম কোডে থাকা উচিত নয়)
লক্ষ্য: কেবল `lib/catalog/local-provider.ts`-এ (ফেজ ১-এ সরানো হবে)।

| ফাইল | ব্যবহার |
|---|---|
| app/layout.tsx | favicon ফাইল পড়া (`public/favicon`) |
| app/not-found.tsx | `content/pages/success` পড়া |
| app/components/ItemList.tsx | `content/` ও `app/content` পড়া |
| app/lib/content/libraryLoader.ts | `content/` পড়া (knip: অব্যবহৃত) |
| app/lib/content/core/loader.ts | `node:fs` (knip: অব্যবহৃত) |
| app/lib/books/extractItems.ts | `content/books` (knip: অব্যবহৃত) |

scripts/ (এখানে fs ঠিক আছে): sync-assets-to-r2.ts, upload-books-to-r2.ts, generate-index.js, generate-library-stats.js, clear-books-bucket.ts

## ২. সরাসরি Supabase / R2
- app/components/ItemListView.tsx — ক্লায়েন্টে `createClient` (anon key); `getCatalog()` দিয়ে যাওয়া উচিত।
- app/lib/books/r2.ts — R2 binding (`ASSETS_BUCKET`), ঠিক আছে; ফেজ ১-এ `lib/content/read.ts`-এ যাবে।

## ৩. 🔴 নিরাপত্তা: wrangler.jsonc-এ গোপন মান
`wrangler.jsonc` গিটে ট্র্যাক হচ্ছে এবং `vars`-এ আছে:
- `SUPABASE_SERVICE_ROLE_KEY` (সবচেয়ে গুরুতর — RLS এড়ায়)
- `R2_SECRET_ACCESS_KEY`, `R2_ACCESS_KEY_ID`, `R2_ACCOUNT_ID`

এগুলো গিট ইতিহাসে (একাধিক commit) আছে। করণীয় (আপনার হাতে):
1. Supabase-এ service-role/secret key **রোটেট** করুন; Cloudflare-এ R2 API token বাতিল করে নতুন বানান।
2. নতুন মান শুধু `.env.local`-এ।
3. তারপর আমি `wrangler.jsonc` থেকে এই চারটি লাইন সরাব (অনুমতি পেলে)।
শুধু ফাইল থেকে সরালে যথেষ্ট নয়, ইতিহাসে থেকে যায় — তাই রোটেট জরুরি।

## ৪. অব্যবহৃত কোড (knip) — মোছার আগে অনুমতি লাগবে
ফাইল (২১): BookCard, Breadcrumb, GenreView, GenreViewClient, LatestBooksGrid, Search, SingleItemView (components); books/extractItems, books/series-sorters, books/toc, build-tab-title, content/core/{factory,loader,types}, content/libraryLoader, generated/library-data, getImageUrl, mdx, queries.js, schema.ts, utils/sortUtils.ts

ডিপেন্ডেন্সি: next-mdx-remote, rehype-stringify, remark, remark-html, remark-parse, remark-rehype, slugify, ts-node(dev)

নোট: কিছু ফাইল ফেজ ১-এ নতুন কাঠামোয় বদলে যাবে, তাই মোছা ফেজ ১-এর পরে করা ভালো।

## ৫. বেসলাইন (২০২৬-১০-২০)
- `tsc --noEmit`: ত্রুটি নেই ✅
- `eslint .`: আগে `.open-next` স্ক্যান করে মেমরি শেষ হতো; ignore যোগ করার পর ১৬০টি সমস্যা (১২৪ error, ৩৬ warning), অধিকাংশ `no-explicit-any`/`require()` স্ক্রিপ্টে
- `npm run build`: সফল ✅ (~৫ মিনিট)
