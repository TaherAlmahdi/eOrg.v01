// bn-text.ts
// One canonical spelling for the Bengali nukta letters, whichever way they were typed:
//   ড + ় (U+09A1 U+09BC) -> ড় (U+09DC)
//   ঢ + ় (U+09A2 U+09BC) -> ঢ় (U+09DD)
//   য + ় (U+09AF U+09BC) -> য় (U+09DF)
// Plain String.normalize('NFC') cannot do this: U+09DC, U+09DD and U+09DF are composition
// exclusions, so NFC always splits them into base letter + nukta.

/** Canonical Bengali text: NFC, then the nukta letters joined into their single code points. */
export function normalizeBn(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/\u09A1\u09BC/g, '\u09DC')
    .replace(/\u09A2\u09BC/g, '\u09DD')
    .replace(/\u09AF\u09BC/g, '\u09DF');
}
