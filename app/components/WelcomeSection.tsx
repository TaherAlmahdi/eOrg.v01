'use client';

import Hero from './Hero';
import WelcomeBadge from './Welcome';

const WelcomeSection = () => {
  return (
      <div
      className="relative w-full max-w-full h-auto overflow-hidden"
      style={{
        backgroundImage: "url('/bg01.png')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-[#cc7a00]/20 z-0 pointer-events-none" />

      {/* মেইন কন্টেন্ট র‍্যাপার: গ্রিড লেআউট */}
      <div className="relative z-10 w-full h-auto max-w-full p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        
        {/* বামপাশের টেক্সট কন্টেন্ট (ডেক্সটপে ২ কলাম নিবে) */}
        <div className="md:col-span-2 space-y-3 font-tarunima">
          <section className="relative bg-transparent">
            <WelcomeBadge />
          </section>

          <div className="text-center md:text-center text-[#004d66] text-lg md:text-2xl font-bold">
            এডুলিচার! &#8651; শিক্ষা, সাহিত্য, সংস্কৃতি &#8651; বিশুদ্ধজ্ঞান
          </div>
          
          <div className="text-gray-800 text-base md:text-xl text-justify font-normal m-0 leading-relaxed">
            জ্ঞান যেখানে সীমাবদ্ধ, বুদ্ধি সেখানে আড়ষ্ট, মুক্তি সেখানে অসম্ভব; স্পষ্ট হয়ে গেল জ্ঞান আর বুদ্ধি এক বস্তু নয়। জ্ঞান হচ্ছে নৈমত্তিক ঘটনাবলী থেকে অর্জিত অভিজ্ঞতা আর বুদ্ধি হচ্ছে, নিজের মনের প্রতিক্রিয়াগুলোকে লক্ষ করার ক্ষমতা, জ্ঞানের বিষয়ে প্রয়োজনীয় সম্বন্ধ আবিষ্কারের ক্ষমতা। বুদ্ধি মানুষ জন্মগতভাবেই লাভ করে। জ্ঞান পরিবার, সমাজ ও পরিবেশ থেকে অর্জন করতে হয়। কিন্তু আমরা বলছি বিশুদ্ধ জ্ঞানের কথা— এটি সেই স্বজ্ঞাত সত্য যা যুক্তি দ্বারা প্রমাণ করতে হয়, এটি বুদ্ধির উচ্চতর অবস্থা, যে অবস্থায় মানুষ মহাসত্যকে উপলব্ধি করতে সক্ষম হন। মূলকথা, বিশুদ্ধজ্ঞান হচ্ছে প্রজ্ঞান যা প্রকৃত জ্ঞানী বা ‘প্রাজ্ঞ’ অর্জন করেন।
          </div>
        </div>

        {/* ডানপাশের ইমেজ কন্টেইনার (ডেক্সটপে ১ কলাম নিবে) */}
        <div className="md:col-span-1 w-full h-auto flex justify-center items-start">        
          <Hero />
        </div>

      </div>
    </div>
  );
};

export default WelcomeSection;