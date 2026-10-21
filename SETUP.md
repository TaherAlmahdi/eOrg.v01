# শুরু করার আগে — একবার করুন

## ১. কিট বসানো
এই ফোল্ডারের ফাইলগুলো `F:\Projects\eOrg.v02`-এ কপি করুন:
- `CLAUDE.md` → প্রজেক্ট রুটে (পুরোনোটি প্রতিস্থাপন করুন; `@AGENTS.md` লাইনটি এতে আছে)
- `docs/PLAN.md`, `docs/PROMPTS.md` → `docs/` ফোল্ডারে
- `.env.example`, `.dev.vars.example` → রুটে

## ২. গিট ব্রাঞ্চ
VS Code টার্মিনালে:
```
git switch main
git pull
git switch -c dev
git add CLAUDE.md docs .env.example .dev.vars.example
git commit -m "Claude Code কিট যোগ"
git push -u origin dev
```
`main`-এ সরাসরি কাজ নয়। পরীক্ষার পর আপনি নিজে `dev` → `main` merge করবেন (GitHub-এ Pull Request দিয়ে)।

## ৩. লোকাল চাবির ফাইল (নিজে, Claude Code নয়)
- `.env.example` কপি করে `.env.local` বানান, মান বসান।
- `.dev.vars.example` কপি করে `.dev.vars` বানান।
- নিশ্চিত হোন দুটোই `.gitignore`-এ আছে (`git status`-এ দেখা যাবে না)।

## ৪. Supabase প্রজেক্ট
- eOrg-এর জন্য আলাদা Supabase প্রজেক্ট ব্যবহার করবেন — শব্দকোষের প্রজেক্ট নয়।
- ফ্রি প্ল্যানে একসাথে ২টি সক্রিয় প্রজেক্ট রাখা যায়। দুটি আগেই থাকলে দেখে নিন eOrg-এর `wrangler.jsonc`-এর Supabase URL কোন প্রজেক্টের। শব্দকোষের হলে eOrg-এর জন্য অন্যটি ব্যবহার করুন বা নতুন বানান (ফাঁকা স্লট লাগবে)।
- চাবি: Project Settings → API Keys। Publishable key → `.env.local` ও `.dev.vars`; Secret key → শুধু `.env.local`।

## ৫. Claude Code-এ শুরু
- VS Code-এ প্রজেক্ট খুলে Claude Code প্যানেল খুলুন।
- অনুমতি মোড "Ask before edits" রাখুন; টার্মিনাল কমান্ডে অনুমতি চাইলে কমান্ড পড়ে দিন। `sync-assets`, `deploy`, `wrangler`, `git push origin main`, `rm`-জাতীয় কমান্ডে "না"।
- `docs/PROMPTS.md` থেকে ফেজ ০-এর প্রম্পট পেস্ট করুন।

## ৬. দৈনন্দিন কাজ (সব ফেজ শেষ হলে)
1. `content/books/{লেখক}/{বই}/index.md` ও অধ্যায় ফাইল, কভার `public/cover/`-এ।
2. `npm run dev` → লোকালে দেখুন।
3. `npm run validate-content` → ভুল থাকলে ঠিক করুন।
4. `npm run sync-assets:dry` → কী আপলোড হবে দেখুন।
5. `npm run sync-assets` → R2 + Supabase হালনাগাদ, লাইভে দেখা যাবে।
কোডে পরিবর্তন না থাকলে বই যোগের জন্য গিট push বা deploy লাগবে না।
