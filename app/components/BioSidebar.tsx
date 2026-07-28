'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InfoField {
  label: string;
  value?: string | React.ReactNode;
  type?: 'text' | 'link' | 'image' | 'list' | 'number' | 'date';
}

interface BioSidebarProps {
  image?: string;
  name?: string;
  infoFields: InfoField[];
  children: React.ReactNode;
}

export default function BioSidebar({ image, name, infoFields, children }: BioSidebarProps) {
  const [showSidebar, setShowSidebar] = useState(true);

  // শুধু যেসব ফিল্ডে মান (value) আছে সেগুলো ফিল্টার করা হচ্ছে
  const validFields = infoFields.filter(
    (field) => field.value !== undefined && field.value !== null && field.value !== ''
  );

  return (
    <>
      {/* মোবাইল টগল বাটন */}
      <div className="mb-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 md:hidden">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-teal-50 text-[#008080] border border-teal-100 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-900 rounded-md transition-all font-tarunima cursor-pointer"
        >
          {showSidebar ? (
            <>
              <EyeOff size={16} />
              <span>সংক্ষিপ্ত তথ্য লুকান</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span>সংক্ষিপ্ত তথ্য দেখুন</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start relative">
        {/* সাইডবার (এখন পুরোপুরি স্টিকি) */}
        {showSidebar && (
          <aside className="w-full md:w-1/3 lg:w-1/4 shrink-0 transition-all duration-300 relative sticky top-6 self-start">
            {/* ডেস্কটপ টগল বাটন: সাইডবারের ডানপাশে (EyeOff) */}
            <button
              onClick={() => setShowSidebar(false)}
              className="hidden md:flex absolute -right-3 top-3 z-20 w-7 h-7 items-center justify-center bg-yellow-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-transform hover:scale-110"
              title="সংক্ষিপ্ত তথ্য লুকান"
              aria-label="Hide Sidebar"
            >
              <EyeOff size={14} />
            </button>

            {/* মেইন কন্টেইনার: হালকা ব্যাকগ্রাউন্ড, রাউন্ডেড কর্নার এবং কোনো অতিরিক্ত বর্ডার ছাড়া */}
            <div className="bg-slate-80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded shadow-sm overflow-hidden">
              
              {/* প্রধান ছবি: কোনো বর্ডার, প্যাডিং বা মার্জিন নেই */}
              {image && (
                <div className="w-full overflow-hidden border-b border-slate-200/80 dark:border-slate-700/60">
                  <img
                    src={image}
                    alt={name || 'Profile Image'}
                    className="w-full h-auto object-cover block"
                  />
                </div>
              )}

              {/* ইনফরমেশন এরিয়া: পরিমিত প্যাডিং দেওয়া হয়েছে */}
              <div className="p-3 md:p-4">
                <h2 className="text-lg font-bold mb-3 pb-1.5 border-b border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white font-tarunima">
                  সংক্ষিপ্ত তথ্য
                </h2>

                <dl className="space-y-2.5 text-sm font-tarunima">
                  {validFields.map((field, index) => (
                    <div 
                      key={index} 
                      className="grid grid-cols-[1fr_auto_1.8fr] gap-x-2 gap-y-1 border-b border-slate-200/60 dark:border-slate-700/50 pb-2 last:border-0 items-baseline"
                    >
                      {/* ১. লেবেল কলাম */}
                      <dt className="font-semibold text-gray-600 dark:text-gray-400">
                        {field.label}
                      </dt>

                      {/* ২. আলাদা কোলন কলাম */}
                      <span className="text-gray-500 dark:text-gray-400 select-none">:</span>

                      {/* ৩. মান কলাম */}
                      <dd className="text-gray-900 dark:text-gray-100 font-medium wrap-break-word min-w-0">
                        {renderFieldValue(field)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

            </div>
          </aside>
        )}

        {/* সাইডবার হাইড অবস্থায় ডেস্কটপ টগল বাটন: কন্টেন্টের বাম পাশে সুন্দরভাবে পজিশন করা */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="hidden md:flex absolute left-0 top-3 z-20 w-7 h-7 items-center justify-center bg-amber-300 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-md text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-transform hover:scale-110"
            title="সংক্ষিপ্ত তথ্য দেখুন"
            aria-label="Show Sidebar"
          >
            <Eye size={14} />
          </button>
        )}

        {/* প্রধান কন্টেন্ট: সাইডবার হাইড হলে বামপাশে প্রয়োজনীয় প্যাডিং দেওয়া হয়েছে যাতে বাটন ও কন্টেন্ট গ গায়ে না লাগে */}
        <article className={`w-full ${showSidebar ? 'md:w-2/3 lg:w-3/4 md:pl-0' : 'w-full md:pl-3'} grow transition-all duration-300`}>
          {children}
        </article>
      </div>
    </>
  );
}

// বিভিন্ন ডাটা টাইপ হ্যান্ডেল করার হেল্পার ফাংশন
function renderFieldValue(field: InfoField) {
  if (field.type === 'link' && typeof field.value === 'string') {
    return (
      <a 
        href={field.value.startsWith('http') ? field.value : `https://${field.value}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-teal-600 dark:text-teal-400 hover:underline break-all"
      >
        {field.value}
      </a>
    );
  }

  if (field.type === 'image' && typeof field.value === 'string') {
    return (
      <img 
        src={field.value} 
        alt={field.label} 
        className="max-h-10 object-contain dark:invert mt-1"
      />
    );
  }

  return field.value;
}