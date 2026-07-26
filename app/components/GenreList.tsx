import type { FC } from "react";
import Link from "next/link";
import { getAllBooks } from "@/app/lib/books"; 
import { CONTENT_REGISTRY, getSlug } from "@/app/lib/content/core/registry";
import { 
  Sparkles, 
  BookOpen, 
  Users, 
  Library, 
  Layers, 
  BookMarked, 
  Scroll, 
  Feather, 
  FileText, 
  Search, 
  Languages, 
  BookText, 
  Compass, 
  Bookmark, 
  History, 
  GraduationCap, 
  Heart, 
  Laugh, 
  Sparkle,
  MoonStar,    // ইসলাম ধর্ম (চাঁদ-তারা)
  Cross,       // খ্রিষ্টধর্ম (ক্রস)
  Sun,         // হিন্দুধর্ম / সনাতন ভাবধারা (পবিত্র সূর্য/জ্যোতি)
  Flower2,     // বৌদ্ধধর্ম / আধ্যাত্মিকতা (পদ্মফুল)
  Flame        // সাধারণ ধর্মীয় ও প্রার্থনামূলক সাহিত্য (পবিত্র শিখা)
} from 'lucide-react';

// ১. Lucide standard icons mapping
const GENRE_ICONS: Record<string, FC<{ className?: string }>> = {
  // সাধারণ সাহিত্যিক স্লাগ
  novel: ({ className }) => <BookMarked className={className} />,
  novella: ({ className }) => <Bookmark className={className} />,
  poetry: ({ className }) => <Feather className={className} />,
  essay: ({ className }) => <Scroll className={className} />,
  essays: ({ className }) => <Scroll className={className} />,
  story: ({ className }) => <BookOpen className={className} />,
  drama: ({ className }) => <Layers className={className} />,
  research: ({ className }) => <Search className={className} />,
  article: ({ className }) => <FileText className={className} />,
  translation: ({ className }) => <Languages className={className} />,
  humor: ({ className }) => <Laugh className={className} />,
  classic: ({ className }) => <BookText className={className} />,
  folklore: ({ className }) => <Compass className={className} />,
  history: ({ className }) => <History className={className} />,
  philosophy: ({ className }) => <GraduationCap className={className} />,

  // ধর্মীয় ভাবপ্রকাশক স্লাগ ও বাংলা নামসমূহ
  religious: ({ className }) => <Flame className={className} />,
  islam: ({ className }) => <MoonStar className={className} />,
  hinduism: ({ className }) => <Sun className={className} />,
  buddhism: ({ className }) => <Flower2 className={className} />,
  christianity: ({ className }) => <Cross className={className} />,

  "ধর্মীয় সাহিত্য": ({ className }) => <Flame className={className} />,
  "ধর্মীয়": ({ className }) => <Flame className={className} />,
  "ইসলাম": ({ className }) => <MoonStar className={className} />,
  "ইসলাম ধর্ম": ({ className }) => <MoonStar className={className} />,
  "হিন্দুধর্ম": ({ className }) => <Sun className={className} />,
  "সনাতন ধর্ম": ({ className }) => <Sun className={className} />,
  "বৌদ্ধধর্ম": ({ className }) => <Flower2 className={className} />,
  "খ্রিষ্টধর্ম": ({ className }) => <Cross className={className} />,
};

// ২. স্মার্ট আইকন ডিটেক্টর ফাংশন
const getGenreIcon = (slug: string, rawText: string): FC<{ className?: string }> => {
  const cleanSlug = slug.toLowerCase().trim();
  const cleanText = rawText.toLowerCase().trim();

  // সরাসরি ম্যাচিং
  if (GENRE_ICONS[cleanSlug]) return GENRE_ICONS[cleanSlug];
  if (GENRE_ICONS[cleanText]) return GENRE_ICONS[cleanText];

  // ধর্মীয় কীওয়ার্ড চেকিং
  if (cleanSlug.includes("islam") || cleanText.includes("ইসলাম")) return GENRE_ICONS.islam;
  if (cleanSlug.includes("hindu") || cleanText.includes("হিন্দু") || cleanText.includes("সনাতন")) return GENRE_ICONS.hinduism;
  if (cleanSlug.includes("buddh") || cleanText.includes("বৌদ্ধ")) return GENRE_ICONS.buddhism;
  if (cleanSlug.includes("christ") || cleanText.includes("খ্রিষ্ট") || cleanText.includes("খ্রিস্ট")) return GENRE_ICONS.christianity;
  if (cleanSlug.includes("religi") || cleanText.includes("ধর্ম")) return GENRE_ICONS.religious;

  // সাধারণ সাহিত্যিক কীওয়ার্ড চেকিং
  if (cleanSlug.includes("novel") || cleanText.includes("উপন্যাস")) return GENRE_ICONS.novel;
  if (cleanSlug.includes("poem") || cleanSlug.includes("poetry") || cleanText.includes("কবিতা")) return GENRE_ICONS.poetry;
  if (cleanSlug.includes("essay") || cleanText.includes("প্রবন্ধ")) return GENRE_ICONS.essay;
  if (cleanSlug.includes("story") || cleanText.includes("গল্প")) return GENRE_ICONS.story;
  if (cleanSlug.includes("hist") || cleanText.includes("ইতিহাস")) return GENRE_ICONS.history;

  // কোনোটি না মিললে ডিফল্ট সুন্দর বইয়ের আইকন
  return ({ className }) => <BookText className={className} />;
};

// সংখ্যাকে বাংলায় রূপান্তর
const toBengaliNumber = (num: number | string): string =>
  num.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);

const GenreList = async () => {
  const allBooks = await getAllBooks();

  const authorSet = new Set<string>();
  const genreMap = new Map<string, { label: string; slug: string; rawGenre: string; count: number }>();

  allBooks.forEach((book) => {
    if (book.author) {
      authorSet.add(book.author);
    }

    const bookGenres = Array.isArray(book.genres) && book.genres.length > 0 
      ? book.genres 
      : ['অন্যান্য'];

    bookGenres.forEach((rawGenre) => {
      const cleanGenre = rawGenre.trim();
      if (!cleanGenre) return;

      const genreSlug = getSlug("genres", cleanGenre);

      if (genreMap.has(genreSlug)) {
        const current = genreMap.get(genreSlug)!;
        genreMap.set(genreSlug, { ...current, count: current.count + 1 });
      } else {
        const label = CONTENT_REGISTRY.genres[genreSlug] || cleanGenre;
        genreMap.set(genreSlug, { label, slug: genreSlug, rawGenre: cleanGenre, count: 1 });
      }
    });
  });

  const genres = Array.from(genreMap.values());
  const totalAuthors = authorSet.size;
  const totalBooks = allBooks.length;

  return (
    <div
      className="relative w-full h-auto overflow-x-clip"    
    >
      <div className="relative z-20 w-full max-w-none mx-auto">
        {/* টাইটেল হেডার */}
        <div className="flex justify-center">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-2 rounded bg-teal-50/90 text-[#008080] mb-8 border border-teal-100 shadow-xs text-center backdrop-blur-md">
            <Layers size={24} className="shrink-0 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-tarunima font-black text-gray-900 leading-none tracking-tight">
              <span className="text-[#008080]">একনজরে</span> এডুলিচার <span className="text-[#cc7a00]">পাঠশালা</span>
            </h1>
          </div>
        </div>

        {/* ১. স্ট্যাটাস কার্ড */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 w-full">
          <div className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-teal-50 text-[#008080] border border-teal-100/50">
                <Users size={32} className="shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">আমাদের পরিবারে</p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  সম্মানিত লেখক <span className="text-[#008080] font-black text-2xl md:text-3xl mx-1">{toBengaliNumber(totalAuthors)}</span> জন
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-amber-50 text-[#cc7a00] border border-amber-100/50">
                <Library size={32} className="shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">সংগ্রহশালায়</p>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  আমাদের প্রকাশিত গ্রন্থ সংখ্যা <span className="text-[#cc7a00] font-black text-2xl md:text-3xl mx-1">{toBengaliNumber(totalBooks)}</span> টি
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* ২. জনরা কার্ড কন্টেইনার */}
        {genres.length === 0 ? (
          <div className="text-center p-8 bg-white/80 rounded-xl text-gray-600 w-full">
            কোনো বই বা জনরা পাওয়া যায়নি।
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-start items-stretch relative z-20 w-full">
            {genres.map(({ slug, label, rawGenre, count }) => {
              const IconComponent = getGenreIcon(slug, rawGenre);

              return (
                <Link
                  key={slug}
                  href={`https://library.eduliture.org/genre/${slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded mb-1 bg-white/90 text-[#008080] border border-teal-100 shadow-sm transition-all duration-300 backdrop-blur-sm hover:bg-teal-50 hover:shadow-lg hover:border-teal-300 hover:scale-[1.02] shrink-0 grow basis-full sm:basis-[calc(50%-0.75rem)] lg:basis-[calc(33.333%-0.75rem)] xl:basis-[calc(25%-0.75rem)] 2xl:basis-[calc(20%-0.75rem)] max-w-full group cursor-pointer overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-orange-50 text-[#cc7a00] group-hover:bg-[#cc7a00] group-hover:text-white transition-colors duration-300 shrink-0">
                      <IconComponent className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                    </div>
                    <h3 className="text-[#008080] group-hover:text-[#cc7a00] text-base md:text-lg font-semibold leading-snug font-tarunima truncate transition-colors">
                      {label}
                    </h3>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-1.5 bg-teal-50 text-[#008080] border border-teal-100 px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                    <BookOpen size={14} className="shrink-0" />
                    <span>{toBengaliNumber(count)} টি</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenreList;