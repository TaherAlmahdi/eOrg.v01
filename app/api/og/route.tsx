import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ১. ইউআরএল থেকে ডাইনামিক ডেটা নেওয়া (Query Parameters)
    const title = searchParams.get('title') || 'এডুলিচার – অনলাইন জ্ঞানকোষ ও লাইব্রেরি';
    const subtitle = searchParams.get('subtitle') || 'অনলাইন বই ও সাহিত্য সংকলন';
    const tagline = searchParams.get('tagline') || 'সহজ ভাষায় সকল বই ও অনুচ্ছেদ পড়ুন';

    // ২. Tarunima ফন্ট লোড করা এবং ArrayBuffer-এ রূপান্তর
    let fontData: ArrayBuffer | null = null;
    try {
      const fontPath = join(process.cwd(), 'public/fonts/tarunima.ttf');
      const buffer = await readFile(fontPath);
      fontData = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } catch (err) {
      console.error('Font load error:', err);
    }

    // ৩. সাইটের গ্লোবাল কনফিগারেশন
    const siteConfig = {
      siteName: 'এডুলিচার',
      logoUrl: 'https://eduliture.org/logo.png',
      bgImageUrl: 'https://eduliture.org/og-bg-pattern.png',
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
          {/* ব্যাকগ্রাউন্ড প্যাটার্ন ইমেজ */}
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
              opacity: 0.3,
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
                'radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)',
            }}
          />

          {/* মাঝের ডাইনামিক টাইটেল সেকশন */}
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
              {title}
            </h1>
          </div>

          {/* নিচের ফুটার সেকশন */}
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
            {/* বাম পাশে: লোগো ও ব্র্যান্ডিং */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={siteConfig.logoUrl}
                alt="Logo"
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
                  {subtitle}
                </span>
              </div>
            </div>

            {/* ডান পাশে: ট্যাগলাইন / ক্যাটাগরি */}
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
                {tagline}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontData
          ? [
              {
                name: 'Tarunima',
                data: fontData,
                style: 'normal',
                weight: 400,
              },
            ]
          : [],
      }
    );
  } catch (e: unknown) {
    const error = e as Error;
    return new Response(`OG Image Gen Error: ${error.message}`, { status: 500 });
  }
}