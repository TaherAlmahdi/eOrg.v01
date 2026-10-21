'use client';

import { useEffect } from 'react';

// Invisible: sends one view per book per browser per day to /api/view
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const key = `bv:${slug}`;
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch {
      return; // storage blocked: skip rather than count every visit
    }

    fetch('/api/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
