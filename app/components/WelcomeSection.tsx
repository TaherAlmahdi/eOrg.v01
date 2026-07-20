'use client';

import Hero from './Hero';
import WelcomeBadge from './Welcome';

const FeatureContent = () => {
  return (
      <div
        /* 
          - w-[100dvw]: dynamic viewport width যা স্ক্রলবারের উইডথ হিসাব করে নিখুঁত স্ক্রিন-ওয়াইড সাইজ দেয়।
          - left-1/2 right-1/2: মেইন কন্টেনারের বাইরে ব্লিড (bleed) করার জন্য।
        */
        className="relative w-dvw left-1/2 right-1/2 overflow-hidden h-auto min-h-25"
        style={{
          backgroundImage: "url('/bg01.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed", 
          /* এখানেও -50dvw ব্যবহার করে স্ক্রলবারজনিত এক্সট্রা পিক্সেল পুশ করা বন্ধ করা হয়েছে */
          marginLeft: "-50dvw",
          marginRight: "-50dvw",
        }}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-[#cc7a00]/20 z-0 pointer-events-none"></div>
      
      {/* মেইন কন্টেন্ট র‍্যাপার: সব কন্টেন্টকে ওভারলের উপরে (z-10) দৃশ্যমান রাখার জন্য */}
      <div className="relative z-10 w-full h-full">
        
        {/* ইমেজ কন্টেইনার: ডেক্সটপে ডানে ফ্লট হবে এবং টেক্সট এটিকে র‍্যাপ করবে */}
        <div className="w-full md:w-1/3 h-auto md:float-right md:mr-2 mb-6 md:mb-2">        
          <div className="flex flex-col items-center justify-center md:block">
            {/* ইমেজের কন্টেইনার */}
            <div className="w-full flex justify-center aspect-auto">
               <Hero />
            </div>
          </div>
        </div>

        {/* ডেসক্রিপশন টেক্সট: এটি প্রদীপের ইমেজের চারপাশে প্রবাহিত হবে */}
                {/* Welcome Badge Section: ব্যাকগ্রাউন্ড ট্রান্সপারেন্ট করা হয়েছে যাতে মূল গোল্ডেন ব্যাকগ্রাউন্ডটি দেখা যায় */}
        <section className="relative bg-transparent">
          <div className="max-w-full mx-auto">
            <WelcomeBadge />
          </div>
        </section>
        <div className="space-y-1 text-gray-800 text-base md:text-xl text-justify leading-relaxed font-normal px-4 md:px-6">
          জ্ঞান যেখানে সীমাবদ্ধ, বুদ্ধি সেখানে আড়ষ্ট, মুক্তি সেখানে অসম্ভব; স্পষ্ট হয়ে গেল জ্ঞান আর বুদ্ধি এক বস্তু নয়। জ্ঞান হচ্ছে নৈমত্তিক ঘটনাবলী থেকে অর্জিত অভিজ্ঞতা আর বুদ্ধি হচ্ছে, নিজের মনের প্রতিক্রিয়াগুলোকে লক্ষ করার ক্ষমতা, জ্ঞানের বিষয়ে প্রয়োজনীয় সম্বন্ধ আবিষ্কারের ক্ষমতা। বুদ্ধি মানুষ জন্মগতভাবেই লাভ করে। জ্ঞান পরিবার, সমাজ ও পরিবেশ থেকে অর্জন করতে হয়। কিন্তু আমরা বলছি বিশুদ্ধ জ্ঞানের কথা— এটি সেই স্বজ্ঞাত সত্য যা যুক্তি দ্বারা প্রমাণ করতে হয়, এটি বুদ্ধির উচ্চতর অবস্থা, যে অবস্থায় মানুষ মহাসত্যকে উপলব্ধি করতে সক্ষম হন। মূলকথা, বিশুদ্ধজ্ঞান হচ্ছে প্রজ্ঞান যা প্রকৃত জ্ঞানী বা ‘প্রাজ্ঞ’ অর্জন করেন।
        </div>

        {/* ফ্লট ক্লিয়ার করার জন্য */}
        <div className="clear-both"></div>
      </div>
    </div>
  );
};

export default FeatureContent;