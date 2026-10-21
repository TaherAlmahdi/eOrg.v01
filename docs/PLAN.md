# eOrg — স্থাপত্য ও কাজের পরিকল্পনা

> ⚠️ **সিদ্ধান্ত বদল (২০২৬-১০-২০):** ক্যাটালগ এখন শুধু R2 `_manifest` থেকে; **Supabase বাদ**। নিচের Supabase সংক্রান্ত অংশ (§২ প্রবাহ, §৩ supabase-provider, §৪ স্কিমা, ফেজ ২–৪) বাতিল/অচল। পাঠকপ্রিয় বইয়ের জন্য পরে Cloudflare D1 (শুধু ভিউ গণনা)।

## ১. লক্ষ্য

1. লোকালে `content/`-এ বই বানালে `npm run dev`-এ সঙ্গে সঙ্গে দেখা যাবে।
2. `npm run sync-assets` চালালে বইয়ের ফাইল ও কভার R2-এ যাবে, ক্যাটালগ Supabase-এ হালনাগাদ হবে, আর লাইভ সাইটে (eduliture.org ও সাবডোমেইন) দেখা যাবে।
3. হোমপেজের সব কম্পোনেন্ট — পরিসংখ্যান, সর্বশেষ বই, ঘরানা, প্রকরণ, লেখক, সিরিজ — এক উৎস থেকে সঠিক তথ্য দেখাবে।
4. Supabase ভবিষ্যতের জন্য প্রস্তুত থাকবে: সার্চ, পাঠকের অ্যাকাউন্ট, বুকমার্ক, পড়ার অগ্রগতি, রিভিউ, পরিসংখ্যান, এবং পরে eReader অ্যাপ ও স্টোর।

## ২. তথ্যের প্রবাহ

```
লোকাল (আপনার পিসি)
  content/books/{author}/{book}/index.md + অধ্যায়/আইটেম .md
  public/cover/...
        │
        ├── npm run dev  (CONTENT_SOURCE=local)
        │      └─ local-provider: ফাইল থেকে সরাসরি ক্যাটালগ ও লেখা → localhost-এ দেখা
        │
        └── npm run sync-assets
               1. validate   → frontmatter যাচাই (ভুল থাকলে থামবে)
               2. R2 upload  → শুধু বদলানো ফাইল (hash মিলিয়ে)
               3. Supabase   → authors, genres, series, books, items upsert
               4. manifest   → R2-এ _manifest/*.json (ফলব্যাক)
               5. revalidate → লাইভ সাইটকে ক্যাশ নতুন করতে বলা (ফেজ ৬)
               6. orphans    → R2-এ বাড়তি ফাইলের তালিকা দেখাবে, মুছবে না (--prune দিলে নিশ্চিতকরণ চেয়ে)

লাইভ (Cloudflare Worker)
  ক্যাটালগ  ← Supabase (publishable key, RLS: শুধু published পড়া যায়)
             ↳ ব্যর্থ হলে R2 _manifest (ফলব্যাক)
  বইয়ের লেখা ← R2 binding ASSETS_BUCKET
  কভার      ← https://media.eduliture.org/cover/...
```

গিট: শুধু কোড। `main` = লাইভ (Cloudflare GitHub বিল্ড), কাজ হবে `dev` ব্রাঞ্চে, পরীক্ষার পর আপনি `main`-এ merge করবেন।

## ৩. কোড কাঠামো (লক্ষ্য)

```
lib/catalog/
  types.ts              Book, Author, Genre, Series, Item, Catalog, LibraryStats
  schema.ts             frontmatter যাচাই (zod)
  build-from-files.ts   buildCatalogFromFiles(fileList) — sync ও local-provider দুজনেই ব্যবহার করে
  provider.ts           getCatalogProvider(): CONTENT_SOURCE অনুযায়ী local / supabase
  local-provider.ts     fs থেকে (শুধু dev, dynamic import)
  supabase-provider.ts  Supabase থেকে, ব্যর্থ হলে manifest-provider
  manifest-provider.ts  R2 _manifest থেকে
  index.ts              getCatalog(), getBook(slug), getLibrarySnapshot(), searchCatalog(q)
lib/content/
  read.ts               বইয়ের লেখা পড়া: local হলে fs, নইলে R2 binding
lib/supabase/
  server.ts             Worker-এর জন্য ক্লায়েন্ট (publishable key)
scripts/
  sync-assets.ts        উপরের ৬টি ধাপ, --dry-run ও --prune ফ্ল্যাগ
  validate-content.ts   শুধু যাচাই
supabase/migrations/    SQL (আপনি নিজে SQL Editor-এ চালাবেন)
```

## ৪. Supabase স্কিমা (খসড়া — ফেজ ২-এ চূড়ান্ত হবে)

ক্যাটালগ (sync স্ক্রিপ্ট লেখে, সবাই পড়ে):
- `people` — লেখক/অনুবাদক/সম্পাদক: slug, name_bn, name_en, bio, image, subdomain
- `genres` — slug, name_bn
- `series` — slug, name_bn
- `item_types` — প্রকরণ: slug, name_bn (কবিতা, গল্প, প্রবন্ধ…)
- `books` — slug, title, subtitle, summary, cover_key, r2_prefix, series_id, series_order, publisher, first_published, published_at, status (draft/published/hidden), content_hash, frontmatter (jsonb — কোনো ফিল্ড হারাবে না), updated_at
- `book_people` — book_id, person_id, role (author/translator/editor)
- `book_genres` — book_id, genre_id
- `book_items` — book_id, item_type_id, title, slug, r2_key, position
- view `library_stats` — বই, লেখক, ঘরানা, সিরিজ, আইটেমের সংখ্যা
- function `search_catalog(q)` — বাংলা নাম/শিরোনামে pg_trgm দিয়ে আংশিক মিল

পরের জন্য (এখন শুধু নকশা, পরে চালু):
- `profiles`, `bookmarks`, `reading_progress`, `reviews`, `book_views`

নিরাপত্তা (RLS):
- ক্যাটালগ টেবিল: anon/authenticated শুধু `status = 'published'` সারি পড়তে পারবে; লেখার অধিকার কারও নেই (sync স্ক্রিপ্ট secret key দিয়ে RLS এড়িয়ে লেখে)।
- পাঠকের টেবিল: প্রত্যেকে শুধু নিজের সারি।
- মুছে ফেলা বই: স্ক্রিপ্ট সারি মুছবে না, `status = 'hidden'` করবে।

## ৫. ফেজ

| ফেজ | কাজ | শেষে যা দেখা যাবে |
|---|---|---|
| ০ | প্রস্তুতি: CLAUDE.md, ব্রাঞ্চ, চাবি সরানো, প্রজেক্ট মানচিত্র | Claude Code প্রজেক্ট বোঝে, wrangler.jsonc-এ গোপন মান নেই |
| ১ | `lib/catalog` + local-provider; fs-নির্ভর পুরোনো কোড সরিয়ে এখানে আনা | `npm run dev`-এ লোকাল বই, হোমপেজের সব কম্পোনেন্ট সঠিক |
| ২ | Supabase স্কিমা (migration) | আপনি SQL চালানোর পর টেবিল তৈরি |
| ৩ | নতুন sync-assets (validate → R2 → Supabase → manifest, কোনো স্বয়ংক্রিয় মোছা নয়) | `--dry-run` দেখে, তারপর আসল sync; Supabase-এ ডেটা |
| ৪ | supabase-provider + manifest ফলব্যাক; হোমপেজ ও বই/লেখক/ঘরানা পেজ এতে চালানো | `npm run preview` ও লাইভে সঠিক তথ্য |
| ৫ | এসইও: ক্যানোনিকাল ডোমেইন, ডাইনামিক sitemap, metadata, JSON-LD | sitemap.xml-এ সব বই |
| ৬ | ক্যাশ ও তাৎক্ষণিক হালনাগাদ: sync শেষে `/api/revalidate` | sync-এর পর কয়েক সেকেন্ডে লাইভে |
| ৭ | গতি: ফন্ট, AOS, ছবি, PWA → Turbopack | ছোট JS, দ্রুত লোড |
| ৮ | (পরে) সার্চ পেজ, পাঠকের অ্যাকাউন্ট, বুকমার্ক | — |

## ৬. অগ্রগতি
(Claude Code প্রতিটি ফেজ শেষে এখানে লিখবে: তারিখ, কী হলো, কী বাকি)

### ফেজ ০ — ২০২৬-১০-২০
- প্রজেক্ট মানচিত্র: docs/PROJECT-MAP.md
- বেসলাইন: tsc ✅, build ✅ (~৫ মিনিট), eslint ১৬০ সমস্যা (১২৪ error, ৩৬ warning)
- eslint config-এ `.open-next` ইত্যাদি ignore (আগে মেমরি শেষ হতো)
- বাকি: wrangler.jsonc-এর গোপন মান — সাইট সম্পূর্ণ হলে ব্যবহারকারী চাবি রোটেট করবেন, তারপর সরানো হবে (সিদ্ধান্ত: এখন নয়)

### ফেজ ১ (R2-ভিত্তিক) — ২০২৬-১০-২০
- নতুন `lib/catalog/` (entries, items, stats): ম্যানিফেস্ট থেকে বই/প্রকরণ/স্ট্যাটস, ঐচ্ছিক `subdomain` ফিল্টার।
- প্রকরণ: `ItemList` এখন `fs`-এর বদলে items ম্যানিফেস্ট ব্যবহার করে; শুধু `item`/`items` ফ্রন্টম্যাটার (আগে genre/category-ও গোনা হতো); নাম/স্লাগ রেজিস্ট্রি থেকে। যাচাই: ৫৮২টি .md, ১৬টি প্রকরণ (পুরোনো স্ট্যাটসের সাথে মিলেছে)।
- `ItemListView` থেকে Supabase ফলব্যাক সরানো (JSX অপরিবর্তিত)।
- `LibraryStats` এখন ম্যানিফেস্ট থেকে হিসাব করে (generated ফাইল আর লাগে না)।
- `sync-assets-to-r2.ts`: স্বয়ংক্রিয় মোছা বন্ধ; `--dry-run` (`npm run sync-assets:dry`) ও `--prune` (নিশ্চিতকরণসহ); item slug রেজিস্ট্রি থেকে।
- বাকি: (১) আপনি `npm run sync-assets:dry` দেখে `npm run sync-assets` চালালে R2 ম্যানিফেস্টে রেজিস্ট্রি-স্লাগ যাবে; (২) সাবডোমেইন ফিল্টার লাইব্রেরি হোমে চালু করা (সিদ্ধান্ত বাকি); (৩) পাঠকপ্রিয় বই (D1); (৪) অব্যবহৃত ফাইল/প্যাকেজ (supabase-js সহ) মোছা — অনুমতি লাগবে।

### পাঠকপ্রিয় বই (D1) — ২০২৬-১০-২০
- `migrations/0001_book_views.sql`, `lib/popular/views.ts` (অ্যাটমিক +১, ১০ মিনিট ক্যাশ), `POST /api/view`, `ViewTracker` (বইয়ের পেজে, দিনে একবার/ব্রাউজার), `PopularBooks` (লাইব্রেরি হোমে "নতুন বই"-এর নিচে; `LatestBooks`-এর একই কার্ড/গ্রিড, ডিজাইন অপরিবর্তিত)।
- D1 binding `DB` না থাকলে সবকিছু নীরবে বন্ধ, সাইট ভাঙে না। চালু করার ধাপ: docs/D1-SETUP.md (আপনি করবেন)।
- tsc ✅, build ✅, নতুন ফাইলে eslint পরিষ্কার।

### D1 চালু ও পাঠকপ্রিয় বই চূড়ান্ত — ২০২৬-১০-২০
- D1 `eorg-db` তৈরি, binding `DB` (`wrangler.jsonc`), `migrations/0001_book_views.sql` remote-এ চালানো হয়েছে।
- `PopularBooks` এখন আলাদা স্বয়ংসম্পূর্ণ কম্পোনেন্ট (`LatestBooks` অপরিবর্তিত): প্রথম লাইনে সর্বোচ্চ ৮টি, ১৬টি বইয়ে ভিউ জমলে দ্বিতীয় লাইন।
- `wrangler.jsonc` থেকে গোপন চাবি (`vars`) সরানো হয়েছে; রানটাইম কোড এগুলো ব্যবহার করে না (শুধু scripts/ `.env.local` থেকে পড়ে)।
- tsc ✅, build ✅। eslint-এ পুরোনো `any`/অব্যবহৃত ভেরিয়েবলের সমস্যা বাকি।
- বাকি: ডিপ্লয়ের পর ভিউ গণনা যাচাই; পুরোনো commit-এর চাবি রোটেট করা।

### ফেভিকন, ট্যাব টাইটেল ও sync-assets ট্র্যাশ — ২০২৬-১০-২০
- ফেভিকন: `app/layout.tsx` থেকে `fs` বাদ (Workers-এ ফাইল সিস্টেম নেই, তাই লাইভে মূল ফেভিকন আসত); সাবডোমেইন→আইকন তালিকা কোডে।
- ট্যাব টাইটেল: হোম `সাইট ❀ ট্যাগ`, অন্য পেজ `পেজ ❀ সাইট`, বই `উপশিরোনাম ❀ চ্যাপ্টার ❀ খণ্ড ❀ বই ❀ সাইট`; অমিল পেজগুলো (ঘরানা, সিরিজ, প্রকরণ, লেখক সাবডোমেইন) ঠিক।
- `sync-assets`: লোকালে মোছা ফাইল R2-এ `_trash/<সময়>/<মূল পথ>`-এ সরে (কপি, তারপর মূল মোছা); ২০টির বেশি হলে "move" লিখে নিশ্চিত করতে হয় (`--yes` দিলে ছাড়া); `_trash/` সাইট পড়ে না, ম্যানিফেস্টেও নেই; `--prune` বাদ। `CONTENT_ROOT`/`COVER_ROOT` env দিয়ে বই-রিপো আলাদা রাখা যায়।
- slugify রেগুলার এক্সপ্রেশনের ব্যাকস্ল্যাশ (`\s`, `\w`, `ঀ`) আগের কমিটে হারিয়েছিল — ফিরিয়ে আনা হয়েছে। পরের `sync-assets`-এ কিছু আইটেমের `titleSlug`/`href` বদলাতে পারে।
- বাকি: বই-রিপো + GitHub Actions (R2 চাবি GitHub Secrets-এ); অব্যবহৃত স্ক্রিপ্ট (generate-index.js, generate-library-stats.js, upload-books-to-r2.ts, clear-books-bucket.ts) মোছা — অনুমতি লাগবে।

### বই আলাদা রিপোতে (eOrg.v01) — ২০২৬-১০-২০
- `content/` (৩২৬০ ফাইল) ও `public/cover/` (১৩৯) eOrg.v01-এ হুবহু মিলিয়ে নেওয়া হয়েছে (md5 যাচাই; v02-এর নতুন ২০ ফাইল v01-এ কপি, v01-এ commit করা হয়নি)। eOrg.v02 থেকে untrack + `.gitignore`।
- লোকাল প্রোভাইডার `lib/catalog/local-provider.ts` (শুধু `next dev` + `CONTENT_ROOT`) আর ম্যানিফেস্ট-বিল্ডার `lib/catalog/build.ts` (sync ও লোকাল একই)। `/local-media/cover/...` রুট লোকাল কভার দেখায়। কভার URL-এর ভিত্তি `app/lib/cover-base.ts` (`NEXT_PUBLIC_COVER_BASE`)।
- `.env.local`-এ যোগ করতে হবে (আপনি): `CONTENT_ROOT=F:/Projects/eOrg.v01/content`, `COVER_ROOT=F:/Projects/eOrg.v01/public/cover`, `NEXT_PUBLIC_COVER_BASE=/local-media`; তারপর `npm run dev` আবার চালু।
- `app/not-found.tsx` এখন `fs`-এর বদলে R2 থেকে সাফল্যের গল্প পড়ে (Workers-এ আগে ফাঁকা আসত)।

### ব্রেডক্রাম্ব এক কম্পোনেন্টে — ২০২৬-১০-২১
- `app/components/Breadcrumb.tsx`: সব পেজের একই ব্রেডক্রাম্ব বার (হোম আইকন, `/` বিভাজক, `href` থাকলে লিংক)। বই, প্রকরণ-আইটেম, বইয়ের তালিকা, লেখক, ঘরানা, সিরিজ, প্রকরণ তালিকা ও লেখক-সাবডোমেইন ঘরানা পেজে ব্যবহৃত; অব্যবহৃত import সরানো। মার্কআপ/ক্লাস অপরিবর্তিত।
- tsc ✅, eslint (পরিবর্তিত ফাইল) ✅। `npm run build` এখনো চালানো হয়নি।

### স্লাগ রেজিস্ট্রি → R2 ম্যানিফেস্ট — ২০২৬-১০-২১
- আইটেম পেজ: হেডারে প্রকরণের নাম নেই; সাইডবারে প্রকরণ, গ্রন্থ, লেখক, অনুবাদক, সম্পাদক লিংকসহ।
- স্লাগ লেখার একমাত্র ফাইল: `app/lib/content/core/registry/slug-data.ts` — `"বাংলা নাম": "english slug"` (বাংলা নাম আগে, বর্ণানুক্রমে)। ভাগ: authors (লেখক+অনুবাদক+সম্পাদক), genres, series, tags, books, items। স্লাগ যেভাবেই লিখুন ("Kazi Nazrul Islam" / kazi-nazrul-islam) ছোট হাতের URL-ফ্রেন্ডলি হয়; না লিখলে বাংলা নামই স্লাগ।
- `npm run sync-assets` এখন `_manifest/slugs.json`ও লেখে (রেজিস্ট্রি + বইয়ে পাওয়া সব নাম/প্রকরণ)। সাইট `loadSlugManifest()` (30 সেকেন্ড ক্যাশ) দিয়ে পড়ে; ফাইল না থাকলে `slug-data.ts` ফলব্যাক। নতুন স্লাগে ডিপ্লয় লাগে না।
- লোকাল `next dev`-এও একই `buildCatalogFromFiles()` থেকে slugs ম্যানিফেস্ট আসে।
- `registry.ts`-এর পুরোনো স্লাগ-তালিকা ও `items.ts`-এর ITEM_REGISTRY ডেটা সরে `slug-data.ts`-এ গেছে (`getSlug`, `getAuthorTitle`, `getItemSlug`… একই নামে আছে)।
- দ্রষ্টব্য: আইটেমে "উপকথা" দুইবার ছিল (novella ও fable); নাম→স্লাগ ফরম্যাটে একটিই থাকে, তাই `fable` রাখা হয়েছে (আগেও `fable`-ই কার্যকর ছিল)। `novella` আইটেম লাগলে অন্য নামে (যেমন "উপন্যাসিকা") যোগ করুন।
