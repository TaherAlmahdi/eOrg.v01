// components/BioSidebar.tsx
'use client';

import React, { useState } from 'react';

interface InfoField {
  label: string;
  value: string;
}

interface BioSidebarProps {
  image?: string;
  name?: string;
  infoFields: InfoField[];
  children: React.ReactNode;
}

export default function BioSidebar({ image, name, infoFields, children }: BioSidebarProps) {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <>
      {/* হাইড / শো টগল বাটন */}
      <div className="mb-4 flex justify-between items-center border-b pb-3">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-teal-50 text-[#008080] border border-teal-100 hover:bg-teal-100 rounded-md transition-all font-tarunima cursor-pointer"
        >
          <span>{showSidebar ? '👁️ সংক্ষিপ্ত তথ্য লুকান' : '📋 সংক্ষিপ্ত তথ্য দেখুন'}</span>
        </button>
      </div>

      {/* রেসপনসিভ লেআউট: সাইডবার বামে, মোবাইলে উপরে */}
      <div className="flex flex-col md:flex-row gap-3 items-start">
        
        {/* বামপাশের সাইডবার */}
        {showSidebar && (
          <aside className="w-full md:w-1/3 lg:w-1/4 shrink-0 transition-all duration-300">
            <div className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded p-2 shadow-sm sticky top-6">
              
              {image && (
                <div className="mb-5 overflow-hidden rounded border bg-white dark:bg-gray-900">
                  <img
                    src={image}
                    alt={name || 'Author Image'}
                    className="w-full h-auto object-cover max-h-80"
                  />
                </div>
              )}

              <h2 className="text-xl font-bold mb-4 pb-2 border-b text-gray-900 dark:text-white font-tarunima">
                সংক্ষিপ্ত তথ্য
              </h2>

              <dl className="space-y-3 text-sm font-tarunima">
                {infoFields.map((field, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                    <dt className="font-semibold text-gray-600 dark:text-gray-400">
                      {field.label}
                    </dt>
                    <dd className="col-span-2 text-gray-900 dark:text-gray-100 font-medium">
                      : {field.value}
                    </dd>
                  </div>
                ))}
              </dl>

            </div>
          </aside>
        )}

        {/* ডানপাশের মূল কন্টেন্ট (সাইডবার হাইড হলে ফুল উইডথ হবে) */}
        <article className={`w-full ${showSidebar ? 'md:w-2/3 lg:w-3/4' : 'w-full'} grow transition-all duration-300`}>
          {children}
        </article>

      </div>
    </>
  );
}