// Writes the build time into worker/build-stamp.ts, so every preview / deploy starts with a fresh page cache.
import { writeFileSync } from 'node:fs';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(
  new URL('../worker/build-stamp.ts', import.meta.url),
  `// Rewritten by scripts/stamp-build.mjs before every preview / deploy, so a new deploy never serves pages cached by older code.\nexport const BUILD_STAMP = '${stamp}';\n`
);
console.log(`Build stamp: ${stamp}`);
