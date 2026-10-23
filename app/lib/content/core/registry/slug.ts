import { normalizeBn } from '@/app/lib/bn-text';
// src/app/lib/content/core/registry/slug.ts

/**
 * যেকোনো টেক্সট (বাংলা/ইংরেজি) থেকে সেফ ইউআরএল স্লাগ তৈরি করে
 */
export const generateRawSlug = (text: string): string => {
  if (!text || typeof text !== "string") return "";

  return (
    text
      // ১. ইউনিকোড নরমাল করা (বাংলা যুক্তবর্ণ ও কার-চিহ্নের সামঞ্জস্যের জন্য)
      .normalize("NFC")
      .trim()
      .toLowerCase()
      // ২. কাস্টম হাইফেন/স্পেস ঠিক করা
      .replace(/[\s\-_]+/g, "-")
      // ৩. বাংলা, ইংরেজি, সংখ্যা ও হাইফেন ছাড়া বাকি সব চিহ্ন বাদ
      .replace(/[^\u0980-\u09FFa-zA-Z0-9\-]/g, "")
      // ৪. একাধিক পরপর হাইফেনকে একটি বানানো
      .replace(/\-+/g, "-")
      // ৫. শুরু ও শেষের হাইফেন ছাঁটাই
      .replace(/^-+|-+$/g, "")
  );
};

/**
 * Normalises Bengali text: composes nukta letters (ড়, ঢ়, য়) so equal names compare equal.
 */
export function normalizeBanglaText(text: string): string {
  if (!text) return "";
  return normalizeBn(String(text))
    .replace(/ড়/g, "ড়")
    .replace(/ঢ়/g, "ঢ়")
    .replace(/য়/g, "য়")
    .replace(/র/g, "র");
}

/**
 * Turns any name or hand-written slug ("Kazi Nazrul Islam", "kazi_nazrul-islam", a Bengali name)
 * into a lower-case URL-friendly slug.
 */
export function toUrlSlug(text: string): string {
  if (!text) return "";
  return generateRawSlug(normalizeBanglaText(text));
}
