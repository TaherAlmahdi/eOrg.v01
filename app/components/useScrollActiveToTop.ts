import { useCallback } from 'react';

/**
 * Returns a callback ref for a TOC's scrollable container. After mount (and whenever
 * `activeKey` changes) it scrolls the container so the element marked with
 * `data-toc-active="true"` sits at its top.
 *
 * Only the container's own `scrollTop` is changed (never `scrollIntoView`), so the
 * page and every other scroll area stay untouched.
 */
export function useScrollActiveToTop(activeKey: string | number) {
  return useCallback(
    (container: HTMLElement | null) => {
      if (!container) return;
      const active = container.querySelector<HTMLElement>('[data-toc-active="true"]');
      if (!active) return;
      const offset =
        active.getBoundingClientRect().top - container.getBoundingClientRect().top;
      container.scrollTop += offset;
    },
    // activeKey is intentionally a dependency: a new callback identity re-runs the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeKey]
  );
}
