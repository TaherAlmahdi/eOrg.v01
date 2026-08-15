import { ImageResponse } from 'next/og';

// Node.js রানটাইম ব্যবহার করা হয়েছে (Next.js 16+ এর জন্য)
export const runtime = 'nodejs';

// ছবির সাইজ ও ফরম্যাট
export const alt = 'Site Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // কাস্টম Tarunima ফন্ট লোড করা
  // (আপনার public/fonts/tarunima.woff2 ফোল্ডারে ফাইলটি থাকতে হবে)
  const fontData = await fetch(
    new URL('https://eduliture.com/fonts/Tarunima.woff2', import.meta.url)
  ).then((res) => res.arrayBuffer());

  // ১. ডাইনামিক ডেটা
  const siteConfig = {
    siteName: 'আমার প্ল্যাটফর্ম',
    siteHeader: 'অনলাইন জ্ঞানকোষ ও লাইব্রেরি',
    tagline: 'সহজ ভাষায় সকল বই ও অনুচ্ছেদ পড়ুন',
    logoUrl: 'https://eduliture.com/logo.png', // আপনার পাবলিক লোগো URL
    bgImageUrl: 'https://eduliture.com/og-bg-pattern.png', // ব্যাকগ্রাউন্ড ইমেজ URL
  };

  // প্রতিটি পেজের জন্য ডিফল্ট পেজ টাইটেল
  const pageTitle = 'আমাদের ওয়েবসাইটে আপনাকে স্বাগতম';

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
          fontFamily: 'Tarunima', // কাস্টম ফন্ট নির্দিষ্ট করা হলো
        }}
      >
        {/* ১. ব্যাকগ্রাউন্ড ইমেজ ও ডার্ক ওভারলে */}
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

        {/* ব্যাকগ্রাউন্ড ওভারলে গ্র্যাডিয়েন্ট */}
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

        {/* ২. উপরের সেকশন: পেজের টাইটেল */}
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

        {/* ৩. নিচের সেকশন: ডাইনামিক লোগো, সাইট হেডার এবং সাইট ট্যাগ */}
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
          {/* বাম পাশে: লোগো ও সাইট হেডার */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
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

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                style={{
                  fontSize: '26px',
                  color: '#ffffff',
                  letterSpacing: '0.5px',
                }}
              >
                {siteConfig.siteName}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  color: '#38bdf8',
                }}
              >
                {siteConfig.siteHeader}
              </span>
            </div>
          </div>

          {/* ডান পাশে: সাইট ট্যাগ / ট্যাগলাইন */}
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
            <span
              style={{
                fontSize: '18px',
                color: '#e2e8f0',
              }}
            >
              {siteConfig.tagline}
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