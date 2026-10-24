import { headers } from 'next/headers';
import { getBioIndex, authorImageUrl } from '@/app/lib/bio';
import { getSubdomainData } from '@/app/lib/get-site-data';

/**
 * Short introduction of an author on the library author page: square picture on the left (on top on mobile),
 * the `summary` of the biography on the right and a "details" button to the biography on the main domain.
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
    <section className="max-w-full mx-auto px-3 md:px-4 pt-4">
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 p-3 md:p-4 bg-white border border-teal-100 shadow-xs">
        <img
          src={authorImageUrl(image || '/authors/default.webp')}
          alt={name || 'লেখকের ছবি'}
          loading="lazy"
          decoding="async"
          className="w-28 h-28 md:w-32 md:h-32 object-cover shrink-0"
        />
        <div className="flex flex-col justify-between grow min-w-0 w-full">
          <p className="text-gray-800 leading-relaxed text-base md:text-lg">{summary}</p>
          <div className="mt-3 flex justify-center md:justify-end">
            <a
              href={detailsUrl}
              className="px-4 py-1.5 text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700 transition-colors"
            >
              বিস্তারিত
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
