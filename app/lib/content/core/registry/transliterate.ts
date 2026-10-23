// app/lib/content/core/registry/transliterate.ts
//
// Bengali -> Latin transliteration for URL slugs of names that have no hand-written slug yet
// (genres, series, item types). It is a plain rule-based romanisation, not a translation:
// "উপন্যাস" -> "uponyas". Edit slug-auto.json (or add the name to slug-data.ts) for a nicer slug.
// No imports: the sync script and the site both load this file.

const INDEPENDENT_VOWELS: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
};

const VOWEL_SIGNS: Record<string, string> = {
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
};

const CONSONANTS: Record<string, string> = {
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't',
};

const HASANTA = '্';
const DIGITS = '০১২৩৪৫৬৭৮৯';

/** One word (no spaces) of Bengali, or anything else, to Latin letters. */
function transliterateWord(word: string): string {
  const chars = Array.from(word);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];
    if (ch in CONSONANTS) {
      // য after a hasanta is the "y" sound (য-ফলা), not "j"
      const afterHasanta = chars[i - 1] === HASANTA;
      out += ch === 'য' && afterHasanta ? 'y' : CONSONANTS[ch];
      if (next && next in VOWEL_SIGNS) {
        out += VOWEL_SIGNS[next];
        i++;
      }
      else if (next === HASANTA) i++; // joins with the next consonant, no vowel
      else if (ch === 'ৎ') continue;
      else if (next !== undefined) out += 'o'; // inherent vowel inside a word
      else if (afterHasanta) out += 'o'; // word ends in a conjunct: "somogro", "sotyo"
    } else if (ch in INDEPENDENT_VOWELS) out += INDEPENDENT_VOWELS[ch];
    else if (ch === 'ং') out += 'ng';
    else if (ch === 'ঃ' || ch === 'ঁ' || ch === HASANTA || ch === '়') continue;
    else if (DIGITS.includes(ch)) out += String(DIGITS.indexOf(ch));
    else out += ch;
  }
  return out;
}

/** URL slug (lower-case ASCII letters, digits, hyphens) from a Bengali name: "হিমু সমগ্র" -> "himu-somogro". */
export function transliterateToSlug(name: string): string {
  return name
    .normalize('NFC')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/য়/g, 'য়') // compose nukta letters
    .split(/[\s\-_,]+/)
    .map(transliterateWord)
    .join('-')
    .toLowerCase()
    .replace(/ngg/g, 'ng')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
