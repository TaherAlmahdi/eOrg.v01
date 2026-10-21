# Claude Code-এর জন্য ফেজভিত্তিক প্রম্পট

ব্যবহার: একটি ফেজের প্রম্পট পেস্ট করুন → Claude Code পরিকল্পনা দেখাবে → পড়ে "হ্যাঁ" বলুন → কাজ শেষে নিচের "যাচাই" নিজে করুন → তারপর পরের ফেজ। কোনো ফেজ শেষ হলে Claude Code-এ `/clear` দিয়ে নতুন করে শুরু করা ভালো (CLAUDE.md ও PLAN.md প্রতিবার পড়বে)।

---

## ফেজ ০ — প্রস্তুতি ও প্রজেক্ট মানচিত্র

```
CLAUDE.md ও docs/PLAN.md পড়ো। এখনই কোনো কোড বদলাবে না।
1. প্রজেক্টের একটি মানচিত্র বানাও docs/MAP.md-এ: প্রতিটি রুট (app/ ও app/subdomains/), কোন কম্পোনেন্ট কোন ডেটা-ফাংশন ডাকে, ডেটা কোথা থেকে আসে (R2 manifest / fs / CONTENT_REGISTRY / generated ফাইল / Supabase)।
2. পুরো প্রজেক্টে খোঁজো: "from 'fs'", "node:fs", "process.cwd()", "supabase", "R2_ACCESS_KEY", "SERVICE_ROLE", "generated/". প্রতিটির ফাইল ও লাইন তালিকা দাও।
3. অব্যবহৃত ফাইলের তালিকা দাও (কোথাও import হয় না) — মুছবে না।
4. wrangler.jsonc-এর vars থেকে গোপন মানগুলো (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, SUPABASE_SERVICE_ROLE_KEY বা যেকোনো secret/service key) সরাও — মান কোথাও প্রিন্ট করবে না। Worker-এর রানটাইম কোড এগুলো ব্যবহার করে কিনা জানাও; করলে সেটা R2 binding বা publishable key দিয়ে বদলানোর প্রস্তাব দাও।
5. .gitignore-এ নিশ্চিত করো: .env*, .dev.vars, cloudflare-env.d.ts, public/sw.js, public/workbox-*.js। এগুলোর মধ্যে যা ট্র্যাক হচ্ছে তা `git rm --cached` করো।
6. .env.example ও .dev.vars.example ঠিক আছে কিনা দেখো (মান ছাড়া)।
commit করো, push নয়।
```

যাচাই: `docs/MAP.md` পড়ুন; `wrangler.jsonc`-এ কোনো গোপন মান নেই।

---

## ফেজ ১ — ক্যাটালগ স্তর ও লোকাল মোড

```
docs/PLAN.md-এর §৩ অনুযায়ী lib/catalog তৈরি করো, শুধু local ও manifest provider এখন:
1. types.ts ও schema.ts (zod): বিদ্যমান index.md frontmatter-এর সব ফিল্ড (scripts/sync-assets-to-r2.ts ও app/lib/books/fetchers.ts যেগুলো পড়ে) ধরো। অজানা ফিল্ড বাদ পড়বে না — raw frontmatter-ও রাখো।
2. build-from-files.ts: ফাইলের তালিকা ও তাদের লেখা নিয়ে পুরো Catalog বানাবে — books, items, people, genres, series, item_types, stats, latest। ফাংশনটি fs-মুক্ত হবে (ইনপুট হিসেবে ফাইল নেবে), যাতে sync স্ক্রিপ্টও ব্যবহার করতে পারে।
3. লেখক/ঘরানা/সিরিজের বাংলা নাম frontmatter থেকে নাও; CONTENT_REGISTRY শুধু ওভাররাইড হিসেবে থাকবে।
4. local-provider.ts: content/ ও public/cover/ পড়ে build-from-files ডাকবে। শুধু CONTENT_SOURCE=local হলে dynamic import। কভার URL লোকালে /cover/..., লাইভে media.eduliture.org।
5. manifest-provider.ts: বিদ্যমান R2 _manifest পড়বে (এখনকার লাইভ আচরণ অক্ষুণ্ণ রাখতে)।
6. বিদ্যমান fetchers/registry/ItemList/LibraryStats/GenreList/AuthorList/SeriesList/LatestBooks এবং layout.tsx-এর favicon fs চেক — সব lib/catalog-এর getLibrarySnapshot() দিয়ে চালাও। লাইব্রেরি হোমপেজ একবার snapshot নিয়ে props-এ পাঠাবে।
7. app/lib/generated/* আর ব্যবহার হবে না — মুছবে না, তালিকা দেবে।
আগে পরিকল্পনা ও বদলানো ফাইলের তালিকা দেখাও।
```

যাচাই: `.env.local`-এ `CONTENT_SOURCE=local` রেখে `npm run dev` → library সাবডোমেইনের হোমপেজ। `content/`-এ একটি পরীক্ষামূলক বই যোগ করুন → রিফ্রেশে পরিসংখ্যান, সর্বশেষ বই, লেখক, ঘরানায় সেটি এসেছে কিনা।

---

## ফেজ ২ — Supabase স্কিমা

```
docs/PLAN.md §৪ অনুযায়ী supabase/migrations/0001_catalog.sql লেখো:
- টেবিল, foreign key, index, updated_at trigger।
- pg_trgm (extensions স্কিমায় থাকলে সেভাবে) এবং search_catalog(q text, lim int) function।
- library_stats view।
- RLS: ক্যাটালগে anon/authenticated শুধু published পড়া; কোনো insert/update/delete policy নয়।
- পাঠকের টেবিল (profiles, bookmarks, reading_progress, reviews, book_views) আলাদা ফাইলে 0002_readers.sql — এখন শুধু লিখে রাখো।
- স্ক্রিপ্ট idempotent হবে (if not exists), কোনো drop নয়।
শেষে বাংলায় বুঝিয়ে দাও প্রতিটি টেবিল কী রাখে। SQL চালাবে না — আমি SQL Editor-এ চালাব।
```

যাচাই: ফাইলটি চালানোর আগে চাইলে আমাকে (চ্যাটে) পাঠান, যাচাই করে দেব। তারপর Supabase → SQL Editor-এ চালান → Table Editor-এ টেবিল দেখুন।

---

## ফেজ ৩ — নতুন sync-assets

```
scripts/sync-assets-to-r2.ts নতুন করে সাজাও (পুরোনোটি scripts/legacy/-এ রেখে দাও):
1. validate: schema.ts দিয়ে সব index.md যাচাই; ভুলে ফাইল ও ফিল্ডসহ বার্তা, তারপর থামবে।
2. R2: content/ ও public/cover/ — শুধু বদলানো ফাইল আপলোড (MD5/ETag মিলিয়ে), সঠিক Content-Type ও Cache-Control।
3. Supabase: build-from-files-এর ফল upsert (slug দিয়ে), সম্পর্ক টেবিল সমন্বয়। লোকালে নেই এমন বই মুছবে না → status='hidden'। SUPABASE_SECRET_KEY শুধু এখানে।
4. R2-এ _manifest/books-index.json ও items-index.json লেখো (ফলব্যাক, আগের গঠন বজায় রেখে)।
5. orphan: R2-এ আছে কিন্তু লোকালে নেই এমন ফাইল শুধু তালিকা করো। `--prune` দিলে তালিকা দেখিয়ে টার্মিনালে "yes" লিখে নিশ্চিত করলে তবেই মুছবে। ডিফল্টে কিছু মুছবে না।
6. `--dry-run`: কিছু না লিখে কী হবে তা দেখাবে।
7. package.json: "validate-content", "sync-assets", "sync-assets:dry" স্ক্রিপ্ট।
শেষে সারাংশ ছাপবে: আপলোড/বাদ, upsert/hidden, orphan সংখ্যা।
তুমি নিজে শুধু `npm run validate-content` চালাতে পারো; sync আমি চালাব।
```

যাচাই: প্রথমে `npm run sync-assets:dry` → আউটপুট পড়ুন → তারপর `npm run sync-assets` → Supabase Table Editor-এ বই ও লেখক।

---

## ফেজ ৪ — লাইভে Supabase থেকে চালানো

```
1. lib/supabase/server.ts: publishable key দিয়ে ক্লায়েন্ট (Worker-এ চলবে)।
2. supabase-provider.ts: ক্যাটালগ ও snapshot Supabase থেকে; ব্যর্থ হলে (টাইমআউট ২ সেকেন্ড) manifest-provider-এ ফলব্যাক, console.warn সহ। ইন-মেমরি ক্যাশ ৬০ সেকেন্ড।
3. provider.ts: CONTENT_SOURCE=local → local; অন্যথায় supabase।
4. হোমপেজ, বই, লেখক, ঘরানা, সিরিজ, আইটেম পেজ এই provider দিয়ে। বইয়ের লেখা lib/content/read.ts দিয়ে R2 থেকে।
5. wrangler.jsonc vars-এ শুধু পাবলিক মান থাকবে (Supabase URL, publishable key)।
6. `npm run build` ও `npx opennextjs-cloudflare build` সফল করো।
```

যাচাই: `.dev.vars`-এ `CONTENT_SOURCE=remote` রেখে `npm run preview` → সব পেজ। ঠিক থাকলে `dev` push → আপনি `main`-এ merge → লাইভ দেখুন।

---

## ফেজ ৫ — এসইও

```
1. lib/site.ts-এ SITE_URL = https://eduliture.org (www ছাড়া); metadataBase, sitemap, robots, OG, JSON-LD সবখানে এটাই। www→non-www 301-এর জন্য Cloudflare Redirect Rule-এর নির্দেশনা আমাকে দাও।
2. ডাইনামিক sitemap ক্যাটালগ থেকে — সাবডোমেইন অনুযায়ী (library.eduliture.org/sitemap.xml ইত্যাদি), lastModified সহ; robots.ts প্রতিটি হোস্টে নিজের sitemap।
3. বই/লেখক/ঘরানা/সিরিজ পেজে generateMetadata (বাংলা title/description, canonical, OG কভার)।
4. JSON-LD: Book, Person, BreadcrumbList। <html lang="bn">।
```

---

## ফেজ ৬ — sync-এর পরপরই লাইভে

```
1. app/api/revalidate/route.ts: POST, হেডারে REVALIDATE_SECRET মিলালে ক্যাটালগ ক্যাশ খালি করবে।
2. node_modules/next/dist/docs ও @opennextjs/cloudflare ডকুমেন্টেশন দেখে প্রস্তাব দাও: R2 incremental cache + tag cache (D1) দিয়ে revalidateTag('catalog') চালু করা যায় কিনা, এবং কী কী Cloudflare রিসোর্স লাগবে (আমি বানাব)।
3. sync-assets-এর শেষ ধাপে এই endpoint ডাকা (SITE_URL ও REVALIDATE_SECRET .env.local থেকে)।
REVALIDATE_SECRET Worker-এ `wrangler secret put` দিয়ে আমি রাখব।
```

---

## ফেজ ৭ — গতি

```
আগে-পরে `npm run build`-এর First Load JS তুলনা দেখিয়ে:
1. ফন্ট: woff2, display swap, যেখানে লাগে শুধু সেখানে।
2. AOS শুধু মূল ডোমেইনের হোমপেজে, অথবা CSS অ্যানিমেশন।
3. কভারের জন্য Cloudflare Image Transformations দিয়ে custom image loader (চালু করার নির্দেশনা আমাকে দেবে)।
4. next-pwa বাদ দিয়ে Serwist বা ছোট service worker → Turbopack-এ ফেরা (dev ও build থেকে --webpack সরানো)।
```
