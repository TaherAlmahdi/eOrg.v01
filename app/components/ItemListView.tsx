// app/components/ItemListView.tsx
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { Layers, BookOpen } from "lucide-react";

export interface ItemTypeData {
  slug: string;
  name: string;
  count: number;
}

export interface ItemListViewProps {
  items?: ItemTypeData[];
  isHomePage?: boolean;
}

const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

// MD/MDX ফাইল স্ক্যান করে ফ্রন্টম্যাটারের item অবজেক্ট থেকে ডাটা নেয়ার লজিক
export async function getRealItemsList(): Promise<ItemTypeData[]> {
  const contentDir = path.join(process.cwd(), "content");

  if (!fs.existsSync(contentDir)) {
    return [];
  }

  // key: name, value: { count, slug }
  const itemMap: Record<string, { count: number; slug: string }> = {};

  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith(".md") || file.endsWith(".mdx")) {
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        const { data } = matter(fileContent);

        // শুধুমাত্র item ফিল্ড চেক করা হচ্ছে
        const itemObj = data.item;

        if (itemObj && typeof itemObj === "object" && itemObj.name) {
          const name = String(itemObj.name).trim();
          
          // link থেকে স্লগ বের করা (যেমন: "/items/story" -> "story")
          let slug = "";
          if (itemObj.link && typeof itemObj.link === "string") {
            slug = itemObj.link.split("/").filter(Boolean).pop() || "";
          }

          if (!slug) {
            slug = name.toLowerCase().replace(/\s+/g, "-");
          }

          if (!itemMap[name]) {
            itemMap[name] = { count: 1, slug };
          } else {
            itemMap[name].count += 1;
          }
        }
      }
    }
  }

  scanDirectory(contentDir);

  const itemsList: ItemTypeData[] = Object.entries(itemMap).map(
    ([name, { count, slug }]) => ({
      slug,
      name,
      count,
    })
  );

  return itemsList.sort((a, b) =>
    a.name.localeCompare(b.name, "bn", { sensitivity: "base" })
  );
}

export default async function ItemListView({
  items,
  isHomePage = false,
}: ItemListViewProps) {
  const displayItems = items ?? (await getRealItemsList());

  if (displayItems.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600 rounded bg-white/80 font-tarunima border border-teal-100">
        কোনো আইটেমের তথ্য পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div className="w-full px-0">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {displayItems.map(({ slug, name, count }) => (
          <Link
            key={slug}
            href={`/items/${slug}`}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded bg-white/90 text-[#008080] border border-teal-100 shadow-sm transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-md hover:border-teal-300 hover:-translate-y-0.5 group cursor-pointer w-full"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-white transition-colors duration-300 shrink-0">
                <Layers className="w-5 h-5 shrink-0" />
              </div>
              <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-base font-semibold leading-snug font-tarunima truncate transition-colors">
                {name}
              </h3>
            </div>

            <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-2 py-1 rounded text-xs md:text-sm font-semibold">
              <BookOpen size={14} className="shrink-0" />
              <span>{toBengaliNumber(count)} টি</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}