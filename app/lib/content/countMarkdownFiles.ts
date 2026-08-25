import fs from "fs";
import path from "path";

const BOOKS_DIR = path.join(process.cwd(), "app", "content", "books");

export function countMarkedItems(
  directory: string = BOOKS_DIR,
  targetKeyword: string = "item" // আপনি যে শব্দটি খুঁজতে চান
): number {
  if (!fs.existsSync(directory)) {
    return 0;
  }

  let count = 0;
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      // সাব-ফোল্ডারের জন্য রিকার্সিভ কল
      count += countMarkedItems(fullPath, targetKeyword);
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".md")
    ) {
      // ফাইলের কন্টেন্ট পড়া
      const fileContent = fs.readFileSync(fullPath, "utf8");

      // শর্ত: ফাইলে নির্দিষ্ট কিওয়ার্ডটি আছে কি না চেক করা
      // (প্রয়োজন অনুযায়ী এখানে রেগুলার এক্সপ্রেশন বা ফ্রন্টম্যাটার পার্সিং বসাতে পারেন)
      if (fileContent.includes(targetKeyword)) {
        count++;
      }
    }
  }

  return count;
}