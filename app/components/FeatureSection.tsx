// FC-এর আগে 'type' কিওয়ার্ডটি যুক্ত করে দেওয়া হলো
import type { FC } from "react";


// আইকন কম্পোনেন্টসমূহ
const BookIcon = () => (
  <svg className="w-14 h-14 text-[#3155E2] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const PenIcon = () => (
  <svg className="w-14 h-14 text-[#3155E2] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const CultureIcon = () => (
  <svg className="w-14 h-14 text-[#3155E2] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const WisdomIcon = () => (
  <svg className="w-14 h-14 text-[#3155E2] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const FeatureSection: FC = () => {
  return (
    <div 
      className="relative w-full h-auto overflow-hidden"
      style={{ 
        backgroundImage: "url('/bg02.png')", 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed' // ব্যাকগ্রাউন্ড ইমেজ স্থির রাখার জন্য
      }}
    >
      {/* সাদা রঙের ৩০% ওভারলে */}
      <div className="absolute inset-0 bg-white/30"></div>

      <div className="relative z-10 mx-auto max-w-full px-2 py-10 md:py-10 lg:px-2">
        
        {/* উপরের টেক্সট সেকশন */}
        <div className="text-center space-y-3 mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#3155E2]">
            বিশুদ্ধজ্ঞানের সরঞ্জাম
          </h2>
          <p className="max-w-4xl mx-auto text-lg md:text-xl leading-relaxed text-gray-800 font-medium">
            আপনার পরিকল্পনা যাই হোক না কেন, আমরা আপনাকে আপনার লক্ষ্যগুলিকে দ্রুত অর্জন করতে সাহায্য করার জন্য আপনাকে সঠিক সরঞ্জাম দিতে এখানে আছি!
          </p>
        </div>

        {/* ৪ কলামের ফিচার গ্রিড */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { 
                Icon: BookIcon, 
                title: "শিক্ষা", 
                text: "শিক্ষা হল জ্ঞানলাভের একটি পদ্ধতিগত প্রক্রিয়া এবং ব্যক্তির সম্ভাবনার পরিপূর্ণ বিকাশ সাধনের অব্যাহত অনুশীলন।" 
            },
            { 
                Icon: PenIcon, 
                title: "সাহিত্য", 
                text: "ইন্দ্রিয় দ্বারা জাগতিক বা মহাজাগতিক চিন্তা চেতনা, অনুভূতি, সৌন্দর্য ও শিল্পের লিখিত বহিঃপ্রকাশ হচ্ছে সাহিত্য।" 
            },
            { 
                Icon: CultureIcon, 
                title: "সংস্কৃতি", 
                text: "সমাজে অর্জিত আচরণ, যোগ্যতা, জ্ঞান, বিশ্বাস, শিল্পকলা, নীতি, আদর্শ, আইন, প্রথা ইত্যাদির সমন্বয় হল সংস্কৃতি।" 
            },
            { 
                Icon: WisdomIcon, 
                title: "বিশুদ্ধজ্ঞান", 
                text: "উপলব্ধি, অনুসন্ধান, শিক্ষা গ্রহণ ও পাঠ্যাভ্যাসের মাধ্যমে অর্জিত ব্যক্তি বা বস্তুর অবস্থা ও গুণাবলী সম্পর্কে ধারণা।" 
            },
          ].map((feature, index) => (
            <div key={index} className="space-y-4 px-2">
              <feature.Icon />
              <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
              <p className="text-lg md:text-xl leading-relaxed text-gray-700 font-normal">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;