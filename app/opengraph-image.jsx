import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// ছবির সাইজ ও ফরম্যাট
export const alt = 'Site Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // ১. ডাইনামিক ডেটা (প্রয়োজনে আপনি API থেকেও আনতে পারেন)
  const siteConfig = {
    siteName: 'আমার প্ল্যাটফর্ম', // সাইটের ডাইনামিক নাম
    siteHeader: 'অনলাইন জ্ঞানকোষ ও লাইব্রেরি', // সাইট হেডার
    tagline: 'সহজ ভাষায় সকল বই ও অনুচ্ছেদ পড়ুন', // সাইট ট্যাগ/ট্যাগলাইন
    logoUrl: 'https://yourdomain.com/logo.png', // সাইট লোগো URL
    bgImageUrl: 'https://yourdomain.com/og-bg-pattern.jpg', // ব্যাকগ্রাউন্ড ইমেজ URL
  };

  // প্রতিটি পেজের জন্য ডিফল্ট পেজ টাইটেল (অথবা মেটাডেটা থেকে পাওয়ার জন্য ব্যবস্থা)
  const pageTitle = 'আমাদের ওয়েবসাইটে আপনাকে স্বাগতম';

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
          backgroundColor: '#0f172a', // ব্যাকগ্রাউন্ড ছবি লোড না হওয়া পর্যন্ত ডিফল্ট কালার
          color: '#ffffff',
          fontFamily: 'sans-serif',
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
            opacity: 0.35, // ব্যাকগ্রাউন্ড ছবির অপাসিটি কমানো যাতে টেক্সট স্পষ্ট দেখা যায়
          }}
        />

        {/* ব্যাকগ্রাউন্ড ওভারলে গ্র্যাডিয়েন্ট */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
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
              fontWeight: 'bold',
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
            {/* ডাইনামিক লোগো */}
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
                  fontWeight: 'bold',
                  color: '#ffffff',
                  letterSpacing: '0.5px',
                }}
              >
                {siteConfig.siteName}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  color: '#38bdf8', // প্রাইমারি অ্যাকসেন্ট কালার
                  fontWeight: '500',
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
                fontWeight: '500',
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
    }
  );
}