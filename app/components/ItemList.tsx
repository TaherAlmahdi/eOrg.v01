// app/components/ItemList.tsx
import type { FC } from "react";
import { cache } from "react";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getItemSlug, ITEM_REGISTRY } from "@/app/lib/content/core/registry";
import ItemListView from "./ItemListView";

// ১. index.md বা index.mdx ছাড়া সব কন্টেন্ট ফাইল রিকার্সিভলি খুঁজে বের করা
const getAllContentFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllContentFiles(fullPath, arrayOfFiles);
    } else {
      const fileName = file.toLowerCase();
      // 🟢 index.md বা index.mdx ফাইল বাদ দিয়ে বাকি সব .md/.mdx ফাইল নেওয়া
      if (
        (fileName.endsWith(".md") || fileName.endsWith(".mdx")) &&
        !fileName.startsWith("index.")
      ) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
};

// ২. প্রতিটি স্বতন্ত্র কন্টেন্ট ফাইলের Frontmatter থেকে আইটেম এক্সট্র্যাক্ট করা
const getProcessedItems = cache(async (authorSlug?: string) => {
  // আপনার কন্টেন্ট বা বইয়ের ফাইল যেখানে থাকে (যেমন: 'content' বা 'data')
  const contentDirectory = path.join(process.cwd(), "content");
  const allFilePaths = getAllContentFiles(contentDirectory);

  const itemMap = new Map<string, { label: string; slug: string; count: number }>();

  allFilePaths.forEach((filePath) => {
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data: frontmatter } = matter(fileContent);

      // লেখক ফিল্টারিং (library বা undefined না হলে)
      if (authorSlug && authorSlug !== "library") {
        const fileAuthor =
          frontmatter.authorSlug ||
          frontmatter.author_slug ||
          frontmatter.author;
        if (
          !fileAuthor ||
          String(fileAuthor).toLowerCase() !== String(authorSlug).toLowerCase()
        ) {
          return; // অন্য লেখকের ফাইল হলে স্কিপ করা
        }
      }

      // 🟢 কেবল আইটেমের ফিল্ডগুলো পার্স করা (জঁরা বা ক্যাটাগরি বাদ)
      const rawItems: string[] = [];

      if (typeof frontmatter.item === "string") rawItems.push(frontmatter.item);
      if (typeof frontmatter.items === "string") rawItems.push(frontmatter.items);
      if (Array.isArray(frontmatter.items)) rawItems.push(...frontmatter.items);
      if (Array.isArray(frontmatter.itemTypes)) rawItems.push(...frontmatter.itemTypes);

      // সংগৃহীত আইটেম ফিল্টার ও কাউন্ট
      rawItems.forEach((rawItem) => {
        if (!rawItem || typeof rawItem !== "string") return;
        const cleanItem = rawItem.trim();
        if (!cleanItem) return;

        const slug = getItemSlug(cleanItem);

        // রেজিস্ট্রি চেক বা ফলব্যাক
        const meta = ITEM_REGISTRY[slug] || ITEM_REGISTRY[cleanItem.toLowerCase()];
        const finalSlug = meta?.slug || slug || cleanItem.toLowerCase();
        const finalLabel = meta?.name || cleanItem;

        const existing = itemMap.get(finalSlug);
        if (existing) {
          existing.count += 1;
        } else {
          itemMap.set(finalSlug, {
            label: finalLabel,
            slug: finalSlug,
            count: 1,
          });
        }
      });
    } catch (e) {
      // ফাইল রিড করতে সমস্যা হলে স্কিপ করা
    }
  });

  return Array.from(itemMap.values());
});

interface ItemListProps {
  sortBy?: "alphabetical" | "count";
  limit?: number;
  authorSlug?: string;
}

const ItemList: FC<ItemListProps> = async ({ sortBy, limit, authorSlug }) => {
  const allItems = await getProcessedItems(authorSlug);

  const isHomePage = !!limit;
  const effectiveSortBy = sortBy || (isHomePage ? "count" : "alphabetical");

  const sortedItems = [...allItems].sort((a, b) => {
    if (effectiveSortBy === "count") {
      return b.count - a.count;
    }
    return a.label.localeCompare(b.label, "bn", { sensitivity: "base" });
  });

  return (
    <div className="relative w-full">
      <ItemListView
        items={sortedItems}
        isHomePage={isHomePage}
        limit={limit}
      />
    </div>
  );
};

export default ItemList;