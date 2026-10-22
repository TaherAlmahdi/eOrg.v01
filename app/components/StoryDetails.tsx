'use client';

import Link from 'next/link';

// সংখ্যা বাংলায় রূপান্তরের হেল্পার
const toBengaliNumber = (num?: number | string): string =>
  num !== undefined && num !== null && num !== ''
    ? num.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)])
    : '';

interface CustomLink {
  name: string;
  link: string;
}

export interface StoryDetailsProps {
  story: any;
  series?: any; // অভিভাবক ফাইল থেকে এক্সপ্লিসিটলি পাস করলেও যেন TypeScript এরর না দেয়
}

export default function StoryDetails({ story, series: explicitSeries }: StoryDetailsProps) {
  if (!story) return null;

  // story.series, story.series_name অথবা প্রপস থেকে আসা explicitSeries গ্রহণ
  const seriesData = story.series || story.series_name || explicitSeries;

  // সিরিজের লিঙ্ক পাওয়ার জন্য হেল্পার ফাংশন
  const getSeriesLink = (seriesName: string): string => {
    // ১. যদি series_links এ্যারে থেকে নাম ম্যাচ করে
    const matchedLink = story.series_links?.find(
      (l: CustomLink) => l.name === seriesName
    )?.link;
    if (matchedLink) return matchedLink;

    // ২. যদি সরাসরি story.series_link থাকে
    if (story.series_link) return story.series_link;

    // ৩. কোনো নির্দিষ্ট লিঙ্ক না থাকলে ডায়নামিক স্লাগ রুট ফলব্যাক
    return `/series/${encodeURIComponent(seriesName)}`;
  };

  return (
    <div className="space-y-3 font-tarunima">
      {/* গল্পের বিস্তারিত তথ্যের মূল কার্ড (নিচে থাকবে) */}
      <div className="p-2 bg-white border border-gray-100 rounded shadow-sm">
        <div className="space-y-2 text-sm text-gray-800">
          {/* গল্পের নাম */}
          {story.title && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">গল্প</span>
              <span className="text-gray-400">:</span>
              <span>{story.title}</span>
            </div>
          )}

          {/* লেখক */}
          {story.author && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">লেখক</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(story.author) ? (
                  story.author.map((a: string, index: number) => {
                    const isLast = index === (story.author as string[]).length - 1;
                    return (
                      <span key={index}>
                        <span>{a}</span>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <span>{story.author}</span>
                )}
              </span>
            </div>
          )}

          {/* অনুবাদক */}
          {story.translator && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">অনুবাদক</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(story.translator) ? (
                  story.translator.map((t: string, index: number) => {
                    const isLast = index === (story.translator as string[]).length - 1;
                    return (
                      <span key={index}>
                        <span>{t}</span>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <span>{story.translator}</span>
                )}
              </span>
            </div>
          )}

          {/* সম্পাদক */}
          {story.editor && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">সম্পাদক</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(story.editor) ? (
                  story.editor.map((e: string, index: number) => {
                    const isLast = index === (story.editor as string[]).length - 1;
                    return (
                      <span key={index}>
                        <span>{e}</span>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <span>{story.editor}</span>
                )}
              </span>
            </div>
          )}

          {/* প্রথম প্রকাশ মাধ্যম */}
          {story.pub_medium && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">প্রথম প্রকাশ</span>
              <span className="text-gray-400">:</span>
              <span>{story.pub_medium}</span>
            </div>
          )}

          {/* প্রথম প্রকাশের সন/তারিখ */}
          {story.first_published && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">প্রকাশকাল</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(story.first_published)}</span>
            </div>
          )}

          {/* প্রকাশক */}
          {story.publisher && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">প্রকাশক</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(story.publisher) ? (
                  story.publisher.map((p: string, index: number) => {
                    const isLast = index === (story.publisher as string[]).length - 1;
                    return (
                      <span key={index}>
                        <span>{p}</span>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <span>{story.publisher}</span>
                )}
              </span>
            </div>
          )}

          {/* অনুস্মৃতি বা উৎস */}
          {story.source_book && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">অনুস্মৃতি</span>
              <span className="text-gray-400">:</span>
              <span>{toBengaliNumber(story.source_book)}</span>
            </div>
          )}

          {/* সিরিজ / গ্রন্থমালা */}
          {seriesData && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">সিরিজ</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1 items-baseline">
                {Array.isArray(seriesData) ? (
                  seriesData.map((s: string, index: number) => {
                    const href = getSeriesLink(s);
                    const isLast = index === (seriesData as string[]).length - 1;

                    return (
                      <span key={index}>
                        <Link
                          href={href}
                          className="text-blue-600 hover:underline transition-colors"
                        >
                          {s}
                        </Link>
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  <Link
                    href={getSeriesLink(String(seriesData))}
                    className="text-blue-600 hover:underline transition-colors"
                  >
                    {seriesData}
                  </Link>
                )}

                {/* যদি পর্ব / seriesOrder থাকে তবে তা ব্র্যাকেটে প্রদর্শন */}
                {(story.seriesOrder || story.part || story.volume) && (
                  <span className="text-gray-500 ml-1">
                    (পর্ব {toBengaliNumber(story.seriesOrder || story.part || story.volume)})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* ঘরানা */}
          {story.genre && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">ঘরানা</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(story.genre) ? (
                  story.genre.map((g: string, index: number) => {
                    const linkObj = story.genre_links?.find(
                      (l: CustomLink) => l.name === g
                    );
                    const isLast =
                      index === (story.genre as string[]).length - 1;
                    return (
                      <span key={index}>
                        {linkObj ? (
                          <Link
                            href={linkObj.link}
                            className="text-blue-600 hover:underline"
                          >
                            {toBengaliNumber(g)}
                          </Link>
                        ) : (
                          toBengaliNumber(g)
                        )}
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : (
                  toBengaliNumber(story.genre)
                )}
              </span>
            </div>
          )}

          {/* প্রকরণ */}
          {story.item && (Array.isArray(story.item) ? story.item.length > 0 : String(story.item).trim() !== '') && (
            <div className="grid grid-cols-[70px_10px_1fr] items-baseline">
              <span className="font-bold">প্রকরণ</span>
              <span className="text-gray-400">:</span>
              <span className="flex flex-wrap gap-x-1">
                {Array.isArray(story.item) ? (
                  story.item.map((itemVal: any, index: number) => {
                    const itemName = typeof itemVal === 'object' && itemVal !== null ? itemVal.name : itemVal;
                    const itemLink = typeof itemVal === 'object' && itemVal !== null ? itemVal.link : story.item_links?.find((l: CustomLink) => l.name === itemName)?.link;
                    
                    const isLast = index === (story.item as any[]).length - 1;

                    return (
                      <span key={index}>
                        {itemLink ? (
                          <Link
                            href={itemLink}
                            className="text-blue-600 hover:underline"
                          >
                            {toBengaliNumber(itemName)}
                          </Link>
                        ) : (
                          toBengaliNumber(itemName)
                        )}
                        {!isLast && <span className="mr-1">,</span>}
                      </span>
                    );
                  })
                ) : typeof story.item === 'object' && story.item !== null ? (
                  story.item.link ? (
                    <Link href={story.item.link} className="text-blue-600 hover:underline">
                      {toBengaliNumber(story.item.name)}
                    </Link>
                  ) : (
                    toBengaliNumber(story.item.name)
                  )
                ) : (
                  toBengaliNumber(story.item)
                )}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}