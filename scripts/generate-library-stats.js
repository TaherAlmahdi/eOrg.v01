const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const PROJECT_ROOT = process.cwd();
const BOOKS_DIR = path.join(PROJECT_ROOT, 'content', 'books');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'app', 'lib', 'generated');

const STATS_OUTPUT_FILE = path.join(OUTPUT_DIR, 'library-stats.ts');
const DATA_OUTPUT_FILE = path.join(OUTPUT_DIR, 'library-data.ts');

// আইটেম/প্রকরণ সংগ্রহ করার হেল্পার ফাংশন
function extractItemsFromData(data) {
  const collected = [];
  if (!data) return collected;

  const itemsField = data.item || data.items;
  if (!itemsField) return collected;

  if (Array.isArray(itemsField)) {
    itemsField.forEach((itm) => {
      if (typeof itm === 'string' && itm.trim()) {
        collected.push(itm.trim());
      } else if (itm && typeof itm === 'object' && itm.name) {
        collected.push(itm.name.trim());
      } else if (itm && typeof itm === 'object' && itm.title) {
        collected.push(itm.title.trim());
      }
    });
  } else if (typeof itemsField === 'string' && itemsField.trim()) {
    collected.push(itemsField.trim());
  } else if (typeof itemsField === 'object') {
    if (itemsField.name) collected.push(itemsField.name.trim());
    else if (itemsField.title) collected.push(itemsField.title.trim());
  }

  return collected;
}

function readBooks() {
  if (!fs.existsSync(BOOKS_DIR)) {
    console.warn(`⚠️ Books directory not found: ${BOOKS_DIR}`);
    return [];
  }

  const books = [];
  const authorDirs = fs.readdirSync(BOOKS_DIR, { withFileTypes: true });

  for (const authorDir of authorDirs) {
    if (!authorDir.isDirectory()) continue;

    const authorDirPath = path.join(BOOKS_DIR, authorDir.name);
    const bookFolders = fs.readdirSync(authorDirPath, { withFileTypes: true });

    for (const bookDir of bookFolders) {
      if (!bookDir.isDirectory()) continue;

      const bookDirPath = path.join(authorDirPath, bookDir.name);
      const indexMdPath = path.join(bookDirPath, 'index.md');

      if (fs.existsSync(indexMdPath)) {
        try {
          // gray-matter দিয়ে index.md পড়া
          const fileContent = fs.readFileSync(indexMdPath, 'utf8');
          const { data } = matter(fileContent);

          const fileItems = extractItemsFromData(data);

          // বইয়ের ফোল্ডারে থাকা অন্যান্য সকল .md এবং .json ফাইল থেকে items সংগ্রহ করা
          const subFiles = fs.readdirSync(bookDirPath).filter(
            (file) => file !== 'index.md' && (file.endsWith('.md') || file.endsWith('.json'))
          );

          subFiles.forEach((subFile) => {
            try {
              const subFilePath = path.join(bookDirPath, subFile);
              const subContent = fs.readFileSync(subFilePath, 'utf8');

              if (subFile.endsWith('.md')) {
                const { data: subData } = matter(subContent);
                fileItems.push(...extractItemsFromData(subData));
              } else if (subFile.endsWith('.json')) {
                const subData = JSON.parse(subContent);
                fileItems.push(...extractItemsFromData(subData));
              }
            } catch (err) {
              // ক্ষতিকর কোনো সাবফাইল থাকলে স্কিপ করবে
            }
          });

          books.push({
            id: data.id || bookDir.name,
            slug: data.slug || data.id || bookDir.name,
            domain: data.domain || '',
            ...data,
            extractedItems: fileItems,
            authorFolder: authorDir.name,
            bookFolder: bookDir.name,
          });
        } catch (error) {
          console.error(`❌ Error parsing ${indexMdPath}:`, error);
        }
      }
    }
  }

  return books;
}

function generateLibraryFiles() {
  const books = readBooks();

  // ১. মোট বই
  const totalBooks = books.length;

  // ২. মোট অথর কাউন্ট (লেখক, সম্পাদক, অনুবাদক সহ)
  const authorsSet = new Set();
  books.forEach((book) => {
    const rawAuthors = [
      book.author,
      book.authors,
      book.translator,
      book.translators,
      book.editor,
      book.editors,
    ];

    rawAuthors.forEach((field) => {
      if (!field) return;
      if (Array.isArray(field)) {
        field.forEach((item) => {
          if (item) authorsSet.add(String(item).trim());
        });
      } else {
        String(field)
          .split(',')
          .forEach((name) => {
            if (name.trim()) authorsSet.add(name.trim());
          });
      }
    });
  });

  // ৩. মোট সিরিজ কাউন্ট
  const seriesSet = new Set();
  books.forEach((book) => {
    if (book.series) {
      if (Array.isArray(book.series)) {
        book.series.forEach((s) => s && seriesSet.add(String(s).trim()));
      } else {
        seriesSet.add(String(book.series).trim());
      }
    }
  });

  // ৪. মোট জঁরা কাউন্ট
  const genresSet = new Set();
  books.forEach((book) => {
    const rawGenre = book.genre || book.genres || book.category;
    if (!rawGenre) return;

    if (Array.isArray(rawGenre)) {
      rawGenre.forEach((g) => g && genresSet.add(String(g).trim()));
    } else {
      String(rawGenre)
        .split(',')
        .forEach((g) => {
          if (g.trim()) genresSet.add(g.trim());
        });
    }
  });

  // ৫. মোট ইউনিক আইটেম / প্রকরণ কাউন্ট
  const itemsSet = new Set();
  books.forEach((book) => {
    if (book.extractedItems && Array.isArray(book.extractedItems)) {
      book.extractedItems.forEach((itemName) => {
        if (itemName) itemsSet.add(itemName);
      });
    }
  });

  const libraryStats = {
    totalAuthors: authorsSet.size,
    totalBooks: totalBooks,
    totalSeries: seriesSet.size,
    totalGenres: genresSet.size,
    totalItems: itemsSet.size,
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // ১. library-stats.ts ফাইল তৈরি (যা আপনার LibraryStats UI কম্পোনেন্ট ইম্পোর্ট করছে)
  const statsContent = `// ⚠️ AUTO-GENERATED FILE
// Generated by scripts/generate-library-data.js
// Do not edit manually.

export const libraryStats = ${JSON.stringify(libraryStats, null, 2)} as const;

export default libraryStats;
`;

  // ২. library-data.ts ফাইল তৈরি (বইয়ের মেটাডেটা সহ)
  const dataContent = `// ⚠️ AUTO-GENERATED FILE
// Generated by scripts/generate-library-data.js
// Do not edit manually.

import { libraryStats } from "./library-stats";

export { libraryStats };

export const libraryBooks = ${JSON.stringify(books, null, 2)} as const;

export default {
  stats: libraryStats,
  books: libraryBooks,
};
`;

  fs.writeFileSync(STATS_OUTPUT_FILE, statsContent, 'utf8');
  fs.writeFileSync(DATA_OUTPUT_FILE, dataContent, 'utf8');

  console.log('✅ Library stats and data generated successfully!');
  console.log(`📊 Generated Stats:`, libraryStats);
  console.log(`📄 Stats File: ${STATS_OUTPUT_FILE}`);
  console.log(`📄 Data File: ${DATA_OUTPUT_FILE}`);
}

generateLibraryFiles();