import Link from 'next/link';
import { listStoryRows, type StoryRow } from '@/lib/stories/local';

interface StorySidebarListsProps {
  /** Supabase id of the story being read */
  storyUuid: string;
}

const LIMIT = 10;

const toBengaliNumber = (num: number): string => String(num).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

/** "১. story ❀ author; author" — one row of the list */
function StoryLine({ row, index, current }: { row: StoryRow; index: number; current: boolean }) {
  const authors = row.author.join('; ');
  return (
    <li className="border-b border-gray-100 last:border-b-0">
      <Link
        href={`/story/${encodeURIComponent(row.slug)}`}
        className={`flex items-baseline gap-2 px-2 py-1.5 text-[14.5px] leading-snug transition-colors ${
          current ? 'bg-orange-50 font-bold text-red-700' : 'text-gray-800 hover:bg-orange-50 hover:text-[#996633]'
        }`}
      >
        <span className="w-6 shrink-0 text-right text-[#669999]">{toBengaliNumber(index + 1)}.</span>
        <span>
          {row.title}
          {authors ? <span className="text-gray-500">{` ❀ ${authors}`}</span> : null}
        </span>
      </Link>
    </li>
  );
}

function SidebarCard({ title, rows, currentUuid, scroll = false }: { title: string; rows: StoryRow[]; currentUuid: string; scroll?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <section className="overflow-hidden bg-white border border-gray-200 rounded shadow-sm font-tarunima">
      <h2 className="px-2 py-1.5 text-lg font-normal text-white bg-[#669999] border-l-4 border-[#008080]">{title}</h2>
      <ol className={`text-[14.5px] ${scroll ? 'max-h-80 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}>
        {rows.map((row, i) => (
          <StoryLine key={row.uuid} row={row} index={i} current={row.uuid === currentUuid} />
        ))}
      </ol>
    </section>
  );
}

/**
 * Left sidebar of the story page:
 * - "<author> অমনিবাস" (and "<translator> অমনিবাস"): every story of that person, most read first
 * - "সেরা দশ কথা": the ten most read stories
 * - "নতুন কথা": the ten newest stories
 */
export default async function StorySidebarLists({ storyUuid }: StorySidebarListsProps) {
  const rows = await listStoryRows();
  const current = rows.find((row) => row.uuid === storyUuid);

  const byViews = (a: StoryRow, b: StoryRow) => b.views - a.views || b.date.localeCompare(a.date);

  // omnibus of the main author, and of the translator when there is one
  const omnibusFor = (name: string | undefined) => {
    if (!name || !current) return null;
    const slug = current.peopleSlugs[name];
    if (!slug) return null;
    const stories = rows.filter((row) => Object.values(row.peopleSlugs).includes(slug)).sort(byViews);
    return { name, stories };
  };
  const omnibuses = [omnibusFor(current?.author[0]), omnibusFor(current?.translator[0])].filter(
    (o): o is { name: string; stories: StoryRow[] } => o !== null
  );
  // a person who is both author and translator appears once
  const uniqueOmnibuses = omnibuses.filter((o, i) => omnibuses.findIndex((x) => x.name === o.name) === i);

  const popular = [...rows].sort(byViews).slice(0, LIMIT);
  const latest = [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, LIMIT);

  return (
    <>
      {uniqueOmnibuses.map((o) => (
        <SidebarCard key={o.name} title={`${o.name} অমনিবাস`} rows={o.stories} currentUuid={storyUuid} scroll />
      ))}
      <SidebarCard title="সেরা দশ কথা" rows={popular} currentUuid={storyUuid} />
      <SidebarCard title="নতুন কথা" rows={latest} currentUuid={storyUuid} />
    </>
  );
}
