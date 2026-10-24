import { headers } from 'next/headers';
import AuthorPhoto from '@/app/components/AuthorPhoto';
import { getBioIndex, authorImageUrl } from '@/app/lib/bio';
import { getSubdomainData } from '@/app/lib/get-site-data';

/**
 * Short introduction of an author on the library author page: 2:3 picture on the left (on top on mobile),
 * the `summary` of the biography (justified, wrapping under the picture when long) and a "জীবনী" button
 * to the biography on the main domain. Renders nothing when the author has no biography summary,
 * and no picture when there is none.
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
    <div className="flow-root p-2 border border-teal-100 bg-white shadow-xs">
      {image && (
        <AuthorPhoto
          src={authorImageUrl(image)}
          alt={name || 'লেখকের ছবি'}
          className="float-left mr-3 mb-1 w-20 sm:w-28 aspect-[2/3] object-contain"
        />
      )}
      <p className="text-justify text-gray-800 leading-relaxed text-base">{summary}</p>
      <div className="mt-2 flex justify-center sm:justify-end">
        <a
          href={detailsUrl}
          className="px-4 py-1.5 text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700 transition-colors"
        >
          জীবনী
        </a>
      </div>
    </div>
  );
}
