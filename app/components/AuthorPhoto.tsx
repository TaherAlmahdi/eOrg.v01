'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Author picture that disappears (no broken-image icon; `fallback` is shown instead, if given) when the file fails to load. */
export default function AuthorPhoto({ src, alt, className, fallback = null }: { src: string; alt: string; className?: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // the image may already have failed before React attached onError
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
