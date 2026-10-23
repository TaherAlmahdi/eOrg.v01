// app/lib/content/core/registry/names.ts
//
// Reading the names of genre / series / item frontmatter fields, and checking them against the registry.
// Only the Bengali names are used; slugs and links written in frontmatter are ignored.
// No fs / alias imports: the sync script and the site both load this file.

/**
 * Names of a frontmatter value: "A, B", ["A", "B"], { name: "A" } or a list of these.
 * Strings are split on commas. Names are trimmed, not normalised.
 */
export function splitNames(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(splitNames);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return splitNames(obj.name ?? obj.title ?? obj.label);
  }
  return String(value)
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

/** Edit distance between two strings, counted in code points. */
export function editDistance(a: string, b: string): number {
  const x = Array.from(a);
  const y = Array.from(b);
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const row = [i];
    for (let j = 1; j <= y.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[y.length];
}

/** The registry name closest to `name` (a probable typo target), or undefined when nothing is close. */
export function closestName(name: string, candidates: Iterable<string>): string | undefined {
  const limit = Math.min(2, Math.floor(Array.from(name).length / 3));
  let best: string | undefined;
  let bestDistance = limit + 1;
  for (const candidate of candidates) {
    const d = editDistance(name, candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}
