// app/components/ItemList.tsx
import type { FC } from "react";
import { cache } from "react";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getItemSlug, ITEM_REGISTRY } from "@/app/lib/content/core/registry";
import ItemListView from "./ItemListView";

// ডিরেক্টরি পাথ সেটিংস
const PRIMARY_CONTENT_DIR = path.join(process.cwd(), "content");
const ALTERNATE_CONTENT_DIR = path.join(process.cwd(), "app/content");

/**
 * রিকার্সিভলি সব .md এবং .mdx ফাইল খুঁজে বের করার হেল্পার
 */
const getAllContentFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  entries.forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      arrayOfFiles = getAllContentFiles(fullPath, arrayOfFiles);
    } else if (entry.isFile()) {
      const fileName = entry.name.toLowerCase();
      if (fileName.endsWith(".md") || fileName.endsWith(".mdx")) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
};

/**
 * বাংলা আদ্যক্ষর নির্ধারণ (ফলা ও যুক্তবর্ণ হ্যান্ডেল করার জন্য)
 */
const getBengaliInitial = (text: string = ''): string => {
  const value = text.normalize('NFC').trim();

  if (!value) return '';

  const firstChar = value.charAt(0);
  if (/^[a-zA-Z]$/.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  const match = value.match(/^([অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়])/);

  if (match && match[1]) {
    return match[1];
  }

  return firstChar;
};

/**
 * ফ্রন্টম্যাটার ডাটা থেকে স্ট্রিং বা অবজেক্ট থেকে আইটেমের নাম বের করার হেল্পার
 */
const extractRawItemsFromFrontmatter = (frontmatter: Record<string, any>): string[] => {
  const rawItems: string[] = [];

  const parseItemValue = (value: any) => {
    if (typeof value === "string" && value.trim()) {
      rawItems.push(value.trim());
    } else if (typeof value === "object" && value !== null) {
      const title = value.title || value.name || value.item || value.type;
      if (typeof title === "string" && title.trim()) {
        rawItems.push(title.trim());
      }
    }
  };

  const candidateFields = [
    frontmatter.item,
    frontmatter.items,
    frontmatter.itemTypes,
    frontmatter.subPages,
    frontmatter.pages,
  ];

  candidateFields.forEach((field) => {
    if (Array.isArray(field)) {
      field.forEach(parseItemValue);
    } else if (field) {
      parseItemValue(field);
    }
  });

  return rawItems;
};

/**
 * সকল ফাইল প্রসেস করে আইটেম এক্সট্র্যাক্ট ও প্রসেস করা
 */
const getProcessedItems = cache(async (authorSlug?: string) => {
  let contentDirectory = PRIMARY_CONTENT_DIR;
  if (!fs.existsSync(contentDirectory) && fs.existsSync(ALTERNATE_CONTENT_DIR)) {
    contentDirectory = ALTERNATE_CONTENT_DIR;
  }

  const allFilePaths = getAllContentFiles(contentDirectory);
  const itemMap = new Map<string, { label: string; slug: string; count: number; initial: string }>();

  allFilePaths.forEach((filePath) => {
    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data: frontmatter } = matter(fileContent);

      if (authorSlug && authorSlug !== "library") {
        const fileAuthor =
          frontmatter.authorSlug ||
          frontmatter.author_slug ||
          frontmatter.author;

        if (
          !fileAuthor ||
          String(fileAuthor).toLowerCase() !== String(authorSlug).toLowerCase()
        ) {
          return;
        }
      }

      const rawItems = extractRawItemsFromFrontmatter(frontmatter);

      rawItems.forEach((cleanItem) => {
        const slug = getItemSlug(cleanItem);

        const meta = ITEM_REGISTRY[slug] || ITEM_REGISTRY[cleanItem.toLowerCase()];
        const finalSlug = meta?.slug || slug || cleanItem.toLowerCase();
        const finalLabel = meta?.name || cleanItem;
        const initial = getBengaliInitial(finalLabel);

        const existing = itemMap.get(finalSlug);
        if (existing) {
          existing.count += 1;
        } else {
          itemMap.set(finalSlug, {
            label: finalLabel,
            slug: finalSlug,
            count: 1,
            initial,
          });
        }
      });
    } catch {
      // ফাইল রিড ট্রাই-ক্যাচ ইগনোর
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