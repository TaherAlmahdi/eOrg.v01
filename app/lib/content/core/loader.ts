// app/lib/content/core/loader.ts

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface LoadedDocument {
  fileName: string;
  fullPath: string;
  frontMatter: Record<string, any>;
  markdown: string;
}

/**
 * একটি নির্দিষ্ট ডিরেক্টরি থেকে সব মার্কডাউন (.md) ফাইল রিড করার কোর ফাংশন
 * এটি Vercel/Production বিল্ড সেফ এবং ফাইল ট্র্যাকিং নিশ্চিত করে
 */
export async function loadContent(directoryPath: string): Promise<LoadedDocument[]> {
  // ১. ডিরেক্টরি অস্তিত্ব পরীক্ষা করা
  if (!fs.existsSync(directoryPath)) {
    console.warn(`Warning: Directory not found at ${directoryPath}`);
    return [];
  }

  // ২. ডিরেক্টরির ভেতরের সব ফাইল রিড করা
  const fileNames = fs.readdirSync(directoryPath);
  
  const allDocs = fileNames
    .filter((fileName) => fileName.endsWith(".md")) // শুধু .md ফাইল ফিল্টার করা
    .map((fileName) => {
      const fullPath = path.join(directoryPath, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      
      // gray-matter দিয়ে ফ্রন্টমেটার ও মেইন বডি আলাদা করা
      const { data, content } = matter(fileContents);

      return {
        fileName,
        fullPath,
        frontMatter: data,
        markdown: content,
      };
    });

  return allDocs;
}