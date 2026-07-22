'use client';

import Hero from './Hero';
import WelcomeBadge from './Welcome';
import Image from 'next/image';
import lightedCandle from '../../public/lighted-candle.gif';

const WelcomeSection = () => {
  return (
    <div
      className="relative w-full h-auto overflow-hidden min-h-auto flex flex-col justify-center p-3 md:p-4"
      style={{
        backgroundImage: "url('/bg01.png')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ১. ব্যাকগ্রাউন্ড সোনালী/অরেঞ্জ ওভারলে */}
      <div className="absolute inset-0 bg-[#cc7a00]/20 z-0 pointer-events-none" />

      {/* ২. সেন্টারড ব্যাকগ্রাউন্ড ক্যান্ডেল ইমেজ (মাঝখানে ট্রান্সপারেন্ট হয়ে থাকবে) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center p-2 md:p-4">
        <div className="relative w-full max-w-xs md:max-w-md lg:max-w-lg aspect-square flex items-center justify-center">
          <Image
            src={lightedCandle}
            alt="বিশুদ্ধজ্ঞানের আলোক"
            fill
            priority
            className="object-contain opacity-5 transition-all duration-500 hover:scale-110 hover:opacity-80 hover:brightness-125 animate-flicker cursor-pointer"
            sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>

      {/* ৩. মেইন কন্টেন্ট লেয়ার (প্রথম ডিভের সম্পূর্ণ প্রস্থ জুড়ে থাকবে) */}
      <div className="relative z-10 w-full space-y-4 pt-10 pb-5 font-tarunima">
        {/* ওয়েলকাম ব্যাজ */}
        <section className="relative bg-transparent flex justify-center">
          <WelcomeBadge />
        </section>

        {/* সাব-হেডিং / টাইটেল */}
        <div className="text-center text-[#004d66] text-lg md:text-2xl font-bold">
          এডুলিচার! &#8651; শিক্ষা, সাহিত্য, সংস্কৃতি &#8651; বিশুদ্ধজ্ঞান
        </div>

        {/* অনুচ্ছেদ ১ */}
        <div className="text-gray-900 text-base md:text-xl text-justify font-normal m-0 leading-relaxed w-full">
          জ্ঞান যেখানে সীমাবদ্ধ, বুদ্ধি সেখানে আড়ষ্ট, মুক্তি সেখানে অসম্ভব; স্পষ্ট হয়ে গেল জ্ঞান আর বুদ্ধি এক বস্তু নয়। জ্ঞান হচ্ছে নৈমত্তিক ঘটনাবলী থেকে অর্জিত অভিজ্ঞতা আর বুদ্ধি হচ্ছে, নিজের মনের প্রতিক্রিয়াগুলোকে লক্ষ করার ক্ষমতা, জ্ঞানের বিষয়ে প্রয়োজনীয় সম্বন্ধ আবিষ্কারের ক্ষমতা। বুদ্ধি মানুষ জন্মগতভাবেই লাভ করে। জ্ঞান পরিবার, সমাজ ও পরিবেশ থেকে অর্জন করতে হয়। কিন্তু আমরা বলছি বিশুদ্ধ জ্ঞানের কথা— এটি সেই স্বজ্ঞাত সত্য যা যুক্তি দ্বারা প্রমাণ করতে হয়, এটি বুদ্ধির উচ্চতর অবস্থা, যে অবস্থায় মানুষ মহাসত্যকে উপলব্ধি করতে সক্ষম হন। মূলকথা, বিশুদ্ধজ্ঞান হচ্ছে প্রজ্ঞান যা প্রকৃত জ্ঞানী বা ‘প্রাজ্ঞ’ অর্জন করেন।
        </div>

        {/* অনুচ্ছেদ ২ (টেক্সট ইনডেন্ট সহ) */}
        <div className="text-gray-900 text-base md:text-xl text-justify font-normal m-0 leading-relaxed indent-8 w-full">
          অতএব, জ্ঞান মানুষের বাহ্যিক অর্জন, বুদ্ধি তার অন্তর্নিহিত বিচারশক্তি, আর বিশুদ্ধ জ্ঞান বা প্রজ্ঞান হলো সেই পরিণত চেতনা, যেখানে জ্ঞান, বুদ্ধি ও আত্মোপলব্ধি একত্রিত হয়ে মানুষকে মহাসত্যের সান্নিদ্ধে পৌঁছে দেয়। সেখানে অজ্ঞতার অবসান ঘটে, বুদ্ধির সংকীর্ণতা দূর হয়, আর মানুষের চেতনা প্রকৃত অর্থেই মুক্তির দিকে অগ্রসর হয়।
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;