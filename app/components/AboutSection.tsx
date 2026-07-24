'use client';

import Link from 'next/link';
import Image from 'next/image'; // Image ইম্পোর্ট যুক্ত করা হলো
import lightedCandle from '../../public/btree.png'; 

const AboutSection = () => {
  return (
    <div
      className="relative w-full overflow-hidden h-auto"
      style={{
        backgroundImage: "url('/bg01.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[#00BCD4]/80 z-0 pointer-events-none"></div>

      <div className="relative z-10 mx-auto max-w-full text-white">
        
        {/* Section One */}
        <div className="text-center pt-6 mb-4 px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-5 drop-shadow-sm text-yellow-300">
            এডুলিচার কী ও কেন?
          </h2>

          <div className="text-white text-lg md:text-xl leading-relaxed max-w-4xl mx-auto font-medium font-tarunima">এডুলিচার বিশুদ্ধজ্ঞানের শিক্ষা বিষয়ক প্রতিষ্ঠান। ১৯৯৭ সালের ২৭শে ডিসেম্বর উন্মুক্ত পাঠাগার প্রতিষ্ঠার মাধ্যমে সবার জন্য বিশুদ্ধজ্ঞান নিশ্চিত করার উদ্দেশ্যে তাহের আলমাহদী কর্তৃক এডুলিচার প্রতিষ্ঠিত হয়।
          </div>     
        </div>

        {/* Section Two */}
        <div className="flex flex-col md:flex-row justify-between gap-0 m-0 p-0 items-end">
          
          {/* Left Column - Image Container */}
          {/* overflow-hidden এবং pb-0 নিশ্চিত করে ইমেজকে একদম নিচে লক করা হয়েছে */}
          <div className="relative w-full md:w-[35%] h-75 md:h-112.5 pl-0 px-0 md:pl-20 md:pr-10 pb-0 m-0 bg-transparent flex items-end overflow-hidden">
            <Image 
              src={lightedCandle} 
              alt="বিশুদ্ধজ্ঞানের আলোক"
              fill
              // bottom-0 যুক্ত করে ইমেজকে ডিভের একদম নিচের বর্ডারের সাথে সারিবদ্ধ করা হয়েছে
              className="w-full h-auto object-contain border-none block m-0 p-0 shadow-none absolute bottom-0"
              priority
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>

          {/* Right Column - Text Content */}
          <div className="w-full md:w-[62%] bg-transparent flex flex-col justify-center px-2 lg:px-2 py-2 md:py-0">
            
            <h3 className="text-yellow-300 text-xl md:text-2xl font-bold mb-5 drop-shadow-sm border-b border-white/20 pb-2 inline-block text-center md:text-left">সবার জন্য নিশ্চিত হোক বিশুদ্ধজ্ঞান
            </h3>

            {/* টেক্সট ইনডেন্ট ২০ পিক্সেল কাস্টম সিএসএস আর্বিট্রারি ভ্যালু দিয়ে ফিক্স করা হয়েছে */}
            <div className="text-white text-lg md:text-xl leading-relaxed opacity-100 font-normal text-justify">
              <p className="indent-0">
                বই পড়লে অনেক কিছু জানা যায়, ফলে জ্ঞান-বুদ্ধি বাড়ে—সে বিষয়ে কোনো সন্দেহ নেই।
                এছাড়াও নিয়মিত বই পড়লে মানুষ শারীরিক ও মানসিকভাবে সুস্থ থাকে; ফলে প্রশান্তি
                পাওয়া যায়, মানসিক চাপ কমে, মনোযোগ বৃদ্ধি পায়, মস্তিষ্ক সচল থাকে, স্মৃতিশক্তির
                উন্নতি ঘটে, কল্পনাশক্তি বাড়ে এবং মস্তিষ্কের স্বাস্থ্যের উন্নতি ঘটে। বই আমাদের
                সামনে খুলে দেয় নতুন দুয়ার।
              </p>

              <p className="indent-5">
                ভূরাজনীতি, মূল্যাধিক্য, মুদ্রণাভাব ইত্যাদি কারণে বই সর্বদা সহজলভ্য হয় না। তাই
                বই সহজলভ্য করার উদ্দেশ্যে এডুলিচার বাংলা সাহিত্যের মেধাস্বত্বমুক্ত ও
                মুদ্রণাভাবে দুর্লভ গ্রন্থাদি নিয়ে সাজিয়েছে{" "}
                <a
                  href="https://library.eduliture.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-300 font-normal"
                >এডুলিচার পাঠশালা</a> নামক অনালাইন প্রকল্প।
              </p>

              <p className="indent-5">
                নিয়মিত ঈশ্বরচন্দ্র বিদ্যাসাগর, বঙ্কিমচন্দ্র চট্টোপাধ্যায়, রবীন্দ্রনাথ ঠাকুর,
                শরৎচন্দ্র চট্টোপাধ্যায়, কাজী নজরুল ইসলাম, সৈয়দ ইসমাইল হোসেন সিরাজিসহ বিশিষ্ট
                কবি-সাহিত্যিকদের গ্রন্থসমূহ নিয়ে পৃথক পৃথক অনলাইন রচনাবলী প্রকল্প বাস্তবায়ন
                করে চলেছে।
              </p>
            </div>

            <div className="mt-8 mb-8 text-center md:text-center">
              <Link
                href="/about"
                className="inline-block bg-white text-[#00BCD4] font-bold py-2.5 px-8 rounded-[10px] shadow-lg hover:bg-gray-100 transition-all active:scale-95 text-base"
              >
                আরও জানুন
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AboutSection;