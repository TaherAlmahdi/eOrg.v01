import { headers } from 'next/headers';
import { getBioIndex, authorImageUrl } from '@/app/lib/bio';
import { getSubdomainData } from '@/app/lib/get-site-data';

/**
 * Short introduction of an author on the library author page: 2:3 picture on the left (on top on mobile),
 * the `summary` of the biography on the right and a "জীবনী" button to the biography on the main domain.
 * Renders nothing when the author has no biography summary.
 */
export default async function AuthorBioCard({ slugs }: { slugs: string[] }) {
  const index = await getBioIndex();
  const slug = slugs.find((s) => s && index[s]?.summary);
  if (!slug) return null;
  const { summary, image, name } = index[slug];

  const host = (await headers()).get('host') || '';
  const subdomain = getSubdomainData(host).subdomain;
  const mainHost = subdomain ? host.replace(`${subdomain}.`, '') : host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const detailsUrl = `${protocol}://${mainHost}/bio/${slug}`;

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-2 p-2 border border-teal-100 bg-white shadow-xs">
      <img
        src={authorImageUrl(image || '/authors/default.webp')}
        alt={name || 'লেখকের ছবি'}
        loading="lazy"
        decoding="async"
        className="w-24 sm:w-28 aspect-[2/3] object-contain shrink-0"
      />
      <div className="flex flex-col justify-between flex-1 min-w-0 w-full">
        <p className="text-gray-800 leading-relaxed text-base">{summary}</p>
        <div className="mt-2 flex justify-center sm:justify-end">
          <a
            href={detailsUrl}
            className="px-4 py-1.5 text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700 transition-colors"
          >
            জীবনী
          </a>
        </div>
      </div>
    </div>
  );
}
