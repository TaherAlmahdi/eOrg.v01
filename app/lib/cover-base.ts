// Base URL for book covers.
// Live: the public R2 domain. Local (`next dev` with COVER_ROOT): NEXT_PUBLIC_COVER_BASE=/local-media
// makes covers load from the books folder via app/local-media/.
export const COVER_BASE = process.env.NEXT_PUBLIC_COVER_BASE || 'https://media.eduliture.org';
