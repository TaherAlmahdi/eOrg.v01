// app/components/ItemList.tsx
import type { FC } from "react";
import { cache } from "react";
import { getItemTypeSummaries } from "@/lib/catalog";
import ItemListView from "./ItemListView";

const getBengaliInitial = (text: string = ''): string => {
  const value = text.normalize('NFC').trim();
  if (!value) return '';

  const firstChar = value.charAt(0);
  if (/^[a-zA-Z]$/.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  const match = value.match(/^([অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়])/);
  if (match && match[1]) {
    return match[1];
  }

  return firstChar;
};

// Item types come from the `item` frontmatter of every .md file in the book folders (R2 items manifest)
const getProcessedItems = cache(async (authorSlug?: string, subdomain?: string) => {
  const summaries = await getItemTypeSummaries({ authorSlug, subdomain });
  return summaries.map((summary) => ({
    ...summary,
    initial: getBengaliInitial(summary.label),
  }));
});

interface ItemListProps {
  sortBy?: "alphabetical" | "count";
  limit?: number;
  authorSlug?: string;
  subdomain?: string;
}

const ItemList: FC<ItemListProps> = async ({ sortBy, limit, authorSlug, subdomain }) => {
  const allItems = await getProcessedItems(authorSlug, subdomain);

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
