// lib/catalog/chapter-paths.ts
// Pure helper: turns the R2 key list of books/ into /book/... URL paths (no file reads).
//   <book>/<chapter>.md                    -> [slug, chapter]
//   <book>/<vol>/chapters/<chapter>.md     -> [slug, vol, chapter]
//   <book>/<vol>/<chapter>.md              -> [slug, vol, chapter]
//   <book>/<vol>/<vol>.md or index.md      -> [slug, vol]
export function getChapterPathSegments(keys: string[], slugByPrefix: Map<string, string>): string[][] {
  const result: string[][] = [];
  for (const key of keys) {
    if (!key.endsWith('.md')) continue;
    const parts = key.split('/');
    if (parts.length < 4) continue;
    const slug = slugByPrefix.get(`${parts[0]}/${parts[1]}/${parts[2]}/`);
    if (!slug) continue;

    const rest = parts.slice(3);
    const file = rest[rest.length - 1].replace(/\.md$/, '');
    if (rest.length === 1) {
      if (file !== 'index') result.push([slug, file]);
    } else if (rest.length === 2) {
      const vol = rest[0];
      result.push(file === 'index' || file === vol ? [slug, vol] : [slug, vol, file]);
    } else if (rest.length === 3 && rest[1] === 'chapters') {
      result.push([slug, rest[0], file]);
    }
  }
  return result;
}
