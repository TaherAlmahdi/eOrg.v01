@AGENTS.md

# eOrg — প্রজেক্ট নির্দেশিকা (Claude Code এটি প্রতিবার পড়বে)

> এই প্রজেক্ট শুধু eOrg (eduliture.org-এর বই পড়ার সাইট)। অন্য কোনো প্রজেক্টের (যেমন শব্দকোষ) কোড, ডাটাবেজ বা নিয়ম এখানে আনবে না।

## এই রিপো = eOrg.v01 (বইয়ের লেখার ঘর) — নিচের সব নিয়মের ওপরে এটি প্রযোজ্য
- এটি **বই ও কভারের রিপো**: `content/` ও `public/cover/` এখানে গিটে commit হয় (`.gitignore` এগুলো ignore করে না)। নিচে যেখানে "এই রিপোতে বই commit হবে না" লেখা, তা eOrg.v02-এর জন্য; এখানে তা প্রযোজ্য নয়।
- `app/`, `lib/`, `scripts/`, কনফিগ — সবই `F:/Projects/eOrg.v02`-এর **হুবহু কপি**। কোড বদলাতে হলে আগে eOrg.v02-এ বদলানো হবে, তারপর এখানে কপি; এখানে সরাসরি কোড বদলাব না (আপনি স্পষ্ট বললে ছাড়া)।
- এই রিপোর সাথে Cloudflare Worker/ডিপ্লয়ের কোনো যোগ নেই। এখানে বই লোকালে লেখা হয়, `npm run dev` লোকাল ফাইল থেকে বই দেখে (`CONTENT_ROOT`, `COVER_ROOT`, `NEXT_PUBLIC_COVER_BASE=/local-media`), যাতে v02 (লাইভ)-এ কেমন দেখাবে ও কোনো error আসবে কিনা আগেই দেখা যায়।
- R2-তে বই, কভার, ম্যানিফেস্ট ও স্লাগ (`_manifest/slugs.json`) পাঠানোর পথ: `npm run sync-assets` (লোকালে, আগে `npm run sync-assets:dry`), এবং পরিকল্পিত GitHub Actions (push করলে স্বয়ংক্রিয়)।
- স্লাগ লেখা হয় `app/lib/content/core/registry/slug-data.ts`-এ (`"বাংলা নাম": "english slug"`)। বদলাতে হলে v02-তে বদলে এখানে কপি।
- গল্প (`content/stories/*.md`) Supabase-এ যায় `npm run sync-stories` (আগে `:dry`) দিয়ে — স্ক্রিপ্ট `scripts/sync-stories.ts`, শুধু এই রিপোতে; `.env.local`-এ `NEXT_PUBLIC_SUPABASE_URL` ও `SUPABASE_SERVICE_ROLE_KEY` লাগে। বই/কভার/স্লাগ যায় `npm run sync-assets` দিয়ে। v02 থেকে কপির সময় `scripts/sync-stories.ts`, `scripts/stories-slug-map.ts`, `.github/` ও package.json-এর sync-stories স্ক্রিপ্ট/`@supabase/supabase-js` মুছে না ফেলতে সাবধান।
- `npm run deploy`, `wrangler ...` এখানে চালাবে না।

## স্থাপত্য (বিস্তারিত: docs/PLAN.md)
- Next.js 16 App Router → OpenNext (@opennextjs/cloudflare) → Cloudflare Workers। সাবডোমেইন রাউটিং proxy.ts-এ।
- বইয়ের লেখা ও কভার: R2 বাকেট `eduliture-assets` (Worker-এ binding `ASSETS_BUCKET`; কভার পাবলিক URL https://media.eduliture.org/cover/...)।
- ক্যাটালগ (বই, লেখক, ঘরানা, সিরিজ, প্রকরণ/আইটেম, পরিসংখ্যান): **শুধু R2** — `_manifest/books-index.json` (index.md থেকে) ও `_manifest/items-index.json` (বুক ফোল্ডারের সব .md-এর `item` ফ্রন্টম্যাটার থেকে)। **Supabase ব্যবহার হবে না** (সিদ্ধান্ত: ২০২৬-১০-২০)।
- পাঠকপ্রিয় বই (ভিউ গণনা): পরিকল্পনা — Cloudflare D1 (KV নয়, কারণ KV-তে অ্যাটমিক +১ নেই ও ফ্রি লেখা সীমা কম)। ক্যাটালগ নয়, শুধু গণনা।
- মূল উৎস: বই ও কভার থাকে আলাদা রিপোতে `F:/Projects/eOrg.v01` (`content/`, `public/cover/`); এই রিপোতে (eOrg.v02) শুধু কোড, বই কখনো commit হবে না (`.gitignore`-এ আছে)। বই-রিপো থেকে `CONTENT_ROOT`/`COVER_ROOT` দিয়ে `npm run sync-assets` চালালে বই ও কভার R2-তে যায়; লোকালে মোছা ফাইল R2-এর `_trash/`-এ সরে (মোছা হয় না)।
- মাল্টি-টেনেন্ট: বইয়ের `subdomain` ফ্রন্টম্যাটার অনুযায়ী `lib/catalog`-এর ফাংশনগুলো সাবডোমেইন ফিল্টার করে।
- লোকাল `next dev`-এ `.env.local`-এ `CONTENT_ROOT` (বই-রিপোর `content/`), `COVER_ROOT` (বই-রিপোর `public/cover/`) ও `NEXT_PUBLIC_COVER_BASE=/local-media` দিলে সাইট লোকাল ফাইল থেকে বই দেখায় (`lib/catalog/local-provider.ts`); না দিলে বা প্রোডাকশনে R2। ম্যানিফেস্ট দুই জায়গায় একই `lib/catalog/build.ts` থেকে বানানো হয়।

## কোডের নিয়ম
- কোডের কমেন্ট, লগ মেসেজ, ভেরিয়েবল নাম ইংরেজিতে; আমার সাথে ব্যাখ্যা বাংলায়।
- রানটাইম কোডে (app/) `fs`/`process.cwd()` শুধু `lib/catalog/local-provider.ts`-এ, এবং তা কেবল `CONTENT_ROOT` সেট থাকলে (শুধু next dev-এ) dynamic import হবে। বাকি সব scripts/-এ।
- ক্যাটালগ পড়া সবসময় `lib/catalog` (`getItemTypeSummaries`, `getLibraryStatsData`, `getBookEntries`…) দিয়ে — কম্পোনেন্ট সরাসরি R2/fs ডাকবে না।
- প্রকরণ (item) শুধু `item`/`items` ফ্রন্টম্যাটার থেকে; স্লাগ/নাম সবসময় `app/lib/content/core/registry/items.ts`-এর `getItemMeta()` দিয়ে (`genre`/`category` প্রকরণ নয়)।
- লোকাল বিল্ড আর sync একই `buildCatalogFromFiles()` ফাংশন ব্যবহার করবে, যাতে লোকালে যা দেখি লাইভেও তা-ই আসে।
- Worker-এ কোনো গোপন চাবি নয়; Worker R2 binding ব্যবহার করে। R2 S3 চাবি কেবল লোকাল স্ক্রিপ্টে (`.env.local`)।
- **ডিজাইন অপরিবর্তনীয়:** JSX মার্কআপ, Tailwind ক্লাস, CSS, লেআউট বদলানো যাবে না — শুধু ডেটা আনা ও কোড কাঠামো।

## নিষেধ (অনুমতি ছাড়া কখনো নয়)
- `.env*`, `.dev.vars` খুলবে না, পড়বে না, প্রিন্ট করবে না। কোনো চাবি কোড, wrangler.jsonc বা commit-এ লিখবে না।
- `main`-এ push/merge করবে না। কাজ হবে `dev` বা feature ব্রাঞ্চে।
- `npm run sync-assets` (`:dry` ছাড়া), `npm run deploy`, `wrangler deploy`, `wrangler r2 ...`, `wrangler secret ...` চালাবে না।
- R2 বা Supabase-এ কিছু মুছবে না। sync স্ক্রিপ্ট কখনো স্বয়ংক্রিয়ভাবে R2 ফাইল মুছবে না।
- SQL নিজে চালাবে না। migration ফাইল `supabase/migrations/`-এ লিখবে; আমি Supabase SQL Editor-এ চালাব।
- কোনো ফাইল/কম্পোনেন্ট মোছা বা পুরো প্রজেক্ট নতুন করে লেখা নয় — তালিকা দেখিয়ে অনুমতি নেবে। বিদ্যমান কোড মেরামত করবে।

## কাজের রীতি
- প্রতিটি ফেজের শুরুতে পরিকল্পনা দেখাবে, আমি "হ্যাঁ" বললে করবে।
- পরিবর্তনের পর: `npx tsc --noEmit`, `npx eslint .`, `npm run build`।
- ছোট ছোট commit, বার্তা বাংলায়। commit বার্তায় কোনো গোপন মান নয়।
- docs/PLAN.md-এর "অগ্রগতি" অংশ প্রতিটি ফেজ শেষে হালনাগাদ করবে।
