import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// ছবির আকৃতি ও টাইপ নির্ধারণ
export const alt = 'Book Overview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// আপনার ডাটাবেস বা API থেকে বইয়ের তথ্য আনার ফাংশন
async function getBookData(slug) {
  // এখানে আপনার ব্যাকএন্ড/API থেকে তথ্য আনবেন
  // উদাহরণস্বরূপ:
  const res = await fetch(`https://api.yourdomain.com/books/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

export default async function Image({ params }) {
  const { slug } = await params;
  const book = await getBookData(slug);

  // কাস্টম ডাইনামিক সাইটের নাম
  const siteName = "আপনার ওয়েবসাইটের নাম (e.g. BoiGhor.com)";

  // শর্ত ১: যদি বইয়ের নিজস্ব OG Image থাকে, তবে সরাসরি সেটি রিটার্ন করবে
  if (book?.customOgImage) {
    const imageRes = await fetch(book.customOgImage);
    const imageBuffer = await imageRes.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }

  // শর্ত ২: যদি নিজস্ব OG Image না থাকে, তবে ডাইনামিক ইমেজ তৈরি হবে
  const title = book?.title || 'গ্রন্থের নাম দেওয়া নেই';
  const volume = book?.volume ? `খণ্ড: ${book.volume}` : '';
  const chapter = book?.chapter ? `পরিচ্ছেদ: ${book.chapter}` : '';
  const author = book?.author || 'লেখকের নাম দেওয়া নেই';
  const coverImage = book?.coverImage || 'https://yourdomain.com/default-cover.jpg'; // ডিফল্ট কভার ইমেজ URL

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
          backgroundColor: '#0f172a', // ব্যাকগ্রাউন্ড কালার (ডার্ক থিম)
          color: '#ffffff',
          padding: '40px 60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* প্রধান কন্টেন্ট সেকশন: বামে বুক কভার, ডানে বিস্তারিত */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '460px',
            alignItems: 'center',
            gap: '50px',
          }}
        >
          {/* বাম দিক: বুক কভার */}
          <div
            style={{
              display: 'flex',
              width: '300px',
              height: '430px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* ডান দিক: গ্রন্থের বিস্তারিত তথ্য */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '710px',
            }}
          >
            {/* গ্রন্থের নাম */}
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#f8fafc',
                margin: '0 0 15px 0',
                lineHeight: 1.2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </h1>

            {/* খণ্ড ও পরিচ্ছেদের নাম */}
            {(volume || chapter) && (
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  fontSize: '24px',
                  color: '#38bdf8', // আকাশী রঙ
                  marginBottom: '20px',
                  fontWeight: '500',
                }}
              >
                {volume && <span>{volume}</span>}
                {volume && chapter && <span>|</span>}
                {chapter && <span>{chapter}</span>}
              </div>
            )}

            {/* লেখকের নাম */}
            <p
              style={{
                fontSize: '28px',
                color: '#94a3b8',
                margin: 0,
                fontWeight: '400',
              }}
            >
              লেখক: <span style={{ color: '#e2e8f0' }}>{author}</span>
            </p>
          </div>
        </div>

        {/* নিচের অংশ: ডাইনামিক ব্র্যান্ড/সাইটের নাম */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '15px',
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: '600',
              color: '#f1f5f9',
              letterSpacing: '1px',
            }}
          >
            {siteName}
          </span>
          <span
            style={{
              fontSize: '18px',
              color: '#64748b',
            }}
          >
            অনলাইনে পড়ুন
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}