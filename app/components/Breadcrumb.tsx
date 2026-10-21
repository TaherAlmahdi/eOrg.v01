import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export interface Crumb {
  label: React.ReactNode;
  /** Leave out for the page you are on; set it for every earlier step. */
  href?: string;
}

/**
 * The one breadcrumb bar used across the whole site: home icon, then each step separated by "/".
 * Steps with an `href` are links, the others are plain text (the current page).
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="w-full bg-[#7575a3] border-b border-gray-200 py-2 px-3 text-white overflow-x-auto no-scrollbar"
    >
      <div className="flex items-center max-w-full mx-auto text-sm font-tarunima whitespace-nowrap">
        <Link href="/" className="transition-colors shrink-0 hover:text-red-100" title="হোম">
          <Home size={16} />
        </Link>
        {items.map((crumb, index) => (
          <React.Fragment key={index}>
            <span className="mx-2 text-white/50 shrink-0">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-red-100 shrink-0">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-white shrink-0">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}
