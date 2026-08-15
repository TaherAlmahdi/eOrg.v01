import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Node.js রানটাইম ব্যবহার করা হয়েছে
export const runtime = 'nodejs';

export const alt = 'Site Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// params ব্যবহারের মাধ্যমে প্রতিটি পেজের ইউআরএল ডাইনামিক করা হয়েছে
export default async function Image({ params }) {
  // ১. ডাইনামিক স্ラグ (slug) বের করা
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  // ২. কাস্টম Tarunima ফন্ট লোড করা
  const fontData = await readFile(
    join(process.cwd(), 'public/fonts/Tarunima.ttf')
  );

  // ৩. ডাইনামিক ডাটা ফেচিং (আপনার API/Database অনুযায়ী ডাটা সেট হবে)
  let pageTitle = 'আমাদের ওয়েবসাইটে আপনাকে স্বাগতম';
  let dynamicTagline = 'সহজ ভাষায় সকল বই ও অনুচ্ছেদ পড়ুন';

  if (slug) {
    try {
      // আপনার অরিজিনাল API এন্ডপয়েন্ট বা ডাটাবেজ কল দিন
      const res = await fetch(`https://eduliture.com/api/posts/${slug}`, {
        next: { revalidate: 3600 } // ক্যাশিং
      });

      if (res.ok) {
        const post = await res.json();
        // পোস্টের টাইটেল ও ক্যাটাগরি বা ট্যাগলাইন সেট করা
        pageTitle = post.title || pageTitle;
        dynamicTagline = post.category || post.tagline || dynamicTagline;
      } else {
        // API না থাকলে স্ラグ (Slug) থেকে সুন্দর করে টাইটেল তৈরি করা
        pageTitle = decodeURIComponent(slug).replace(/-/g, ' ');
      }
    } catch {
      // এরর হলে স্ラグ থেকে টাইটেল ব্যাকআপ হিসেবে রাখা
      pageTitle = decodeURIComponent(slug).replace(/-/g, ' ');
    }
  }

  // ৪. সাইটের গ্লোবাল কনফিগারেশন
  const siteConfig = {
    siteName: 'এডুলিচার',
    siteHeader: 'অনলাইন জ্ঞানকোষ ও লাইব্রেরি',
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
          fontFamily: 'Tarunima',
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

        {/* ব্যাকগ্রাউন্ড ডার্ক ওভারলে */}
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

        {/* ডাইনামিক পেজ টাইটেল */}
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
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: '1000px',
            }}
          >
            {pageTitle}
          </h1>
        </div>

        {/* ফুটার: সাইট নেম, লোগো এবং ডাইনামিক ট্যাগলাইন */}
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
          {/* লোগো ও সাইট নেম */}
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

          {/* ডাইনামিক ট্যাগলাইন/ক্যাটাগরি */}
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
              {dynamicTagline}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Tarunima',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  );
}