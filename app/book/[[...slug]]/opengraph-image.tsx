import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const alt = 'Book Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 🔹 params-এর টাইপ ইন্টারফেস যুক্ত করা হয়েছে
interface ImageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function Image({ params }: ImageProps) {
  const resolvedParams = await params;
  // [[...slug]] এর ক্ষেত্রে params.slug একটি Array হয়
  const slugArray = resolvedParams?.slug;

  // ১. ফন্ট লোড (ArrayBuffer কনভার্সন সহ)
  let fontData: ArrayBuffer | null = null;
  try {
    const buffer = await readFile(join(process.cwd(), 'public/fonts/tarunima.ttf'));
    // Buffer কে ArrayBuffer-এ রূপান্তর
    fontData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (err) {
    console.error('Font load error:', err);
  }

  // ২. ডাইনামিক টাইটেল ও ডাটা হ্যান্ডলিং
  let pageTitle = 'বইয়ের লাইব্রেরি ও বুক কালেকশন';
  let dynamicCategory = 'এডুলিচার বুকস';

  if (slugArray && slugArray.length > 0) {
    // Array-এর শেষ অংশটি সাধারণত মূল বই বা চ্যাপ্টারের নাম নির্দেশ করে
    const rawSlug = slugArray[slugArray.length - 1];

    try {
      // আপনার API কল
      const res = await fetch(`https://eduliture.com/api/books/${rawSlug}`, {
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const book = await res.json();
        pageTitle = book.title || pageTitle;
        dynamicCategory = book.author || book.category || dynamicCategory;
      } else {
        // API না থাকলে ইউআরএল থেকে টাইটেল সুন্দর করে সাজিয়ে নেওয়া
        pageTitle = decodeURIComponent(rawSlug).replace(/-/g, ' ');
      }
    } catch {
      pageTitle = decodeURIComponent(rawSlug).replace(/-/g, ' ');
    }
  }

  const siteConfig = {
    siteName: 'এডুলিচার',
    siteHeader: 'অনলাইন বই ও সাহিত্য লাইব্রেরি',
    logoUrl: 'https://eduliture.com/logo.png',
    bgImageUrl: 'https://eduliture.com/og-bg-pattern.png',
  };

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '60px',
          position: 'relative',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontFamily: fontData ? 'Tarunima' : 'sans-serif',
        }}
      >
        {/* ব্যাকগ্রাউন্ড ইমেজ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={siteConfig.bgImageUrl}
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.35,
          }}
        />

        {/* ডার্ক ওভারলে */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
          }}
        />

        {/* টাইটেল সেকশন */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '360px',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 'normal',
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.3,
              maxWidth: '1000px',
            }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* ফুটার সেকশন */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid rgba(255, 255, 255, 0.2)',
            paddingTop: '25px',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteConfig.logoUrl}
              alt="Site Logo"
              style={{
                width: '65px',
                height: '65px',
                borderRadius: '12px',
                objectFit: 'contain',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '26px', color: '#ffffff', letterSpacing: '0.5px' }}>
                {siteConfig.siteName}
              </span>
              <span style={{ fontSize: '18px', color: '#38bdf8' }}>
                {siteConfig.siteHeader}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '10px 20px',
              borderRadius: '30px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <span style={{ fontSize: '18px', color: '#e2e8f0' }}>
              {dynamicCategory}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: 'Tarunima',
              data: fontData,
              style: 'normal',
            },
          ]
        : [],
    }
  );
}