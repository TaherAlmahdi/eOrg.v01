// app/components/AOSProvider.tsx
'use client';

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AOSProvider() {
  useEffect(() => {
    AOS.init({
      duration: 800, // অ্যানিমেশনের সময়কাল (মি.সে.)
      once: true,    // স্ক্রল করে নিচে নামলে শুধু একবারই অ্যানিমেশন হবে
      easing: 'ease-out-cubic',
    });
  }, []);

  return null; // এটি কোনো ইন্টারফেস রেন্ডার করবে না, ব্যাকগ্রাউন্ডে AOS চালু করবে
}