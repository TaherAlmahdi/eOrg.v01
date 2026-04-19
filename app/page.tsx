'use client';

import WelcomeBadge from './components/Welcome';
import FeatureContent from './components/FeatureContent';
// সব প্রয়োজনীয় আইকন ইম্পোর্ট করা হয়েছে
import { 
  BookOpen, 
  Info, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Feather, 
  Library, 
  History, 
  Mail,
  Archive
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fdfdf7]">
      
      <main className="flex-grow">
        {/* ওয়েলকাম সেকশন */}
        <section className="relative bg-white">
          <div className="max-w-[1440px] mx-auto">
            <WelcomeBadge />
          </div>
        </section>

        {/* ফিচার কন্টেন্ট সেকশন */}
        <section className="relative bg-white pb-[15px]">
          <div className="max-w-[1440px] mx-auto px-3 md:px-6">
            <FeatureContent />
          </div>
        </section>

        {/* বঙ্কিম সাহিত্য বিন্যাস ও ফিচার কার্ডস */}
        <section className="py-10 px-4 bg-[#f0f2f4]">
          <div className="max-w-[1440px] mx-auto">
            
            {/* হেডিং */}
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center gap-4 px-5 py-2 rounded bg-teal-50 text-[#008080] mb-8 animate-pulse border border-teal-100 shadow-sm text-center">
                <Sparkles size={28} className="flex-shrink-0" />
                <h1 className="text-2xl md:text-[32px] font-black text-gray-900 leading-none tracking-tight">
                  <span className="text-[#008080]">বঙ্কিম</span> রচনা <span className="text-[#cc7a00]">বিন্যাস</span>
                </h1>
              </div>
            </div>            

            {/* গ্রিড লেআউট */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              
              {/* ১. উপন্যাস সমগ্র */}
              <Link 
                href="/novel" 
                className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
              >
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">উপন্যাস সমগ্র</h3>
                  <p className="text-xs text-gray-500">বঙ্কিমচন্দ্রের কালজয়ী উপন্যাসসমূহ</p>
                </div>
              </Link>

              {/* ২. রম্য সাহিত্য */}
              <Link 
                href="/humor" 
                className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
              >
                <div className="p-3 bg-teal-50 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Feather size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">রম্য সাহিত্য</h3>
                  <p className="text-xs text-gray-500">কমলাকান্তের দপ্তর ও রম্য রচনা</p>
                </div>
              </Link>

              {/* ৩. ধর্মীয় সাহিত্য */}
              <Link 
                href="/religious" 
                className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
              >
                <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Library size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">ধর্মীয় সাহিত্য</h3>
                  <p className="text-xs text-gray-500">ধর্মতত্ত্ব ও কৃষ্ণচরিত্র আলোচনা</p>
                </div>
              </Link>

              {/* ৪. ইতিহাস ও প্রবন্ধ */}
              <Link 
                href="/essays" 
                className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
              >
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <History size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">ইতিহাস ও প্রবন্ধ</h3>
                  <p className="text-xs text-gray-500">ঐতিহাসিক ও গবেষণামূলক প্রবন্ধ</p>
                </div>
              </Link>

              {/* ৫. পত্রাবলী */}
              <Link 
                href="/letters" 
                className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
              >
                <div className="p-3 bg-pink-50 rounded-xl text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">পত্রাবলী</h3>
                  <p className="text-xs text-gray-500">বঙ্কিম লিখিত চিঠিপত্র ও দলিলাদি</p>
                </div>
              </Link>



              {/* ৬. অন্যান্য / বিবিধ */}
              <Link 
                href="/others" // আপনার জেনার স্লাগ অনুযায়ী এটি /others হওয়া উচিত
                className="flex items-center gap-5 p-4 bg-white rounded border border-gray-100 hover:border-[#008080] transition-all group shadow-sm"
              >
                <div className="p-3 bg-pink-50 rounded-xl text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                  <Archive size={22} /> {/* Archive আইকনটি বিবিধ সংগ্রহ বা আর্কাইভের জন্য উপযুক্ত */}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">বিবিধ</h3>
                  <p className="text-xs text-gray-500">অপ্রকাশিত ও পরিত্যাক্ত রচনাসংগ্রহ</p>
                </div>
              </Link>           
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}