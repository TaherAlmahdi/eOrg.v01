'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { List, X } from 'lucide-react';

/**
 * Left sidebar of the story page.
 * Large screens: a sticky column. Short sidebar: it stays at the top while the story scrolls.
 * Tall sidebar: it scrolls up with the page until its bottom reaches the bottom of the screen, then it stops
 * there, and it leaves with the end of the story. No scroll bars. Phones: a drawer that slides in from the left,
 * opened by a floating button at the bottom left.
 */
export default function SidebarShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const [stickyTop, setStickyTop] = useState(72);

  // sticky `top` that makes a tall sidebar stop when its bottom meets the bottom of the screen
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;
    const update = () => {
      // the site header is sticky: stay below it, or stop 16px above the bottom of the screen when taller
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
      setStickyTop(Math.min(headerHeight + 8, window.innerHeight - aside.offsetHeight - 16));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(aside);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // lock the page behind the drawer while it is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="গল্পের তালিকা খুলুন"
        className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#008080] text-white shadow-lg transition-colors hover:bg-[#006666] lg:hidden"
      >
        <List size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        ref={asideRef}
        style={{ '--sticky-top': `${stickyTop}px` } as CSSProperties}
        className={`order-2 col-span-1 lg:order-1 lg:col-span-3 lg:sticky lg:top-(--sticky-top) lg:self-start lg:z-auto lg:w-auto lg:translate-x-0 lg:overflow-visible lg:bg-transparent lg:px-2 lg:py-2 lg:shadow-none fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm overflow-y-auto bg-[#fdfcf8] px-2 py-2 shadow-2xl transition-transform duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="বন্ধ করুন"
          className="mb-2 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-700 lg:hidden"
        >
          <X size={18} />
        </button>
        <div className="space-y-2">{children}</div>
      </aside>
    </>
  );
}
