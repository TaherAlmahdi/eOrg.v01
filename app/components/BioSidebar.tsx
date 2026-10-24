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
  className?: string;
}

// Left info card: on desktop it sticks while the text scrolls and stops at the end of the article (scrolls
// inside itself, without a scrollbar, if it is taller than the screen); on mobile only the image shows,
// with the "পরিচিতি" details behind a show/hide button.
export default function BioSidebar({ image, name, infoFields, className = '' }: BioSidebarProps) {
  const [showInfo, setShowInfo] = useState(false);

  const validFields = infoFields.filter(
    (field) => field.value !== undefined && field.value !== null && field.value !== ''
  );

  return (
    <aside
      className={`w-full mb-4 md:mb-0 md:sticky md:top-6 md:self-start md:max-h-[calc(100vh-3rem)] md:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <div className="bg-slate-80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded shadow-sm overflow-hidden">
        {image && (
          <div className="w-full overflow-hidden border-b border-slate-200/80 dark:border-slate-700/60">
            <img
              src={image}
              alt={name || 'Profile Image'}
              decoding="async"
              className="w-full h-auto object-cover block"
            />
          </div>
        )}

        {validFields.length > 0 && (
          <div className="p-3 md:p-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-1.5 md:mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-tarunima">
                পরিচিতি
              </h2>
              <button
                onClick={() => setShowInfo(!showInfo)}
                aria-expanded={showInfo}
                className="md:hidden flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium bg-teal-50 text-[#008080] border border-teal-100 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-900 rounded-md transition-all font-tarunima cursor-pointer"
              >
                {showInfo ? (
                  <>
                    <EyeOff size={15} />
                    <span>লুকান</span>
                  </>
                ) : (
                  <>
                    <Eye size={15} />
                    <span>দেখুন</span>
                  </>
                )}
              </button>
            </div>

            <dl
              className={`${showInfo ? 'table' : 'hidden'} md:table w-full text-sm font-tarunima border-separate border-spacing-y-2.5`}
            >
              {validFields.map((field, index) => (
                <div
                  key={index}
                  className="table-row border-b border-slate-200/60 dark:border-slate-700/50"
                >
                  <dt className="table-cell whitespace-nowrap font-semibold text-gray-600 dark:text-gray-400 pr-2 pb-0">
                    {field.label}
                  </dt>
                  <span className="table-cell whitespace-nowrap text-gray-500 dark:text-gray-400 select-none pr-3 pb-0 align-top">
                    :
                  </span>
                  <dd className="table-cell w-full text-gray-900 dark:text-gray-100 font-medium break-word pb-0 align-top">
                    {renderFieldValue(field)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </aside>
  );
}

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
        loading="lazy"
        decoding="async"
        className="max-h-10 object-contain dark:invert mt-1"
      />
    );
  }

  return field.value;
}
