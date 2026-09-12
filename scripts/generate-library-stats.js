const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const PROJECT_ROOT = process.cwd();
const BOOKS_DIR = path.join(PROJECT_ROOT, 'content', 'books');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'app', 'lib', 'generated');

const STATS_OUTPUT_FILE = path.join(OUTPUT_DIR, 'library-stats.ts');
const DATA_OUTPUT_FILE = path.join(OUTPUT_DIR, 'library-data.ts');

// ইউনিকোড নর্মালাইজেশন ও অতিরিক্ত স্পেস সরানোর হেল্পার
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFC') // বাংলা বর্ণমালার ডায়াক্রিটিক্যাল মার্ক ঠিক রাখার জন্য
    .replace(/\s+/g, ' ') // একাধিক স্পেসকে একটি স্পেসে রূপান্তর
    .trim();
}

// আইটেম/প্রকরণ সংগ্রহ করার হেল্পার ফাংশন
function extractItemsFromData(data) {
  const collected = [];
  if (!data) return collected;

  const itemsField = data.item || data.items;
  if (!itemsField) return collected;

  if (Array.isArray(itemsField)) {
    itemsField.forEach((itm) => {
      if (typeof itm === 'string' && itm.trim()) {
        collected.push(normalizeText(itm));
      } else if (itm && typeof itm === 'object') {
        if (itm.name) collected.push(normalizeText(itm.name));
        else if (itm.title) collected.push(normalizeText(itm.title));
      }
    });
  } else if (typeof itemsField === 'string' && itemsField.trim()) {
    collected.push(normalizeText(itemsField));
  } else if (typeof itemsField === 'object') {
    if (itemsField.name) collected.push(normalizeText(itemsField.name));
    else if (itemsField.title) collected.push(normalizeText(itemsField.title));
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
          const fileContent = fs.readFileSync(indexMdPath, 'utf8');
          const { data } = matter(fileContent);

          const fileItems = extractItemsFromData(data);

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
              // স্কিপ এরর
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
      } else {
        console.warn(`⚠️ Warning: index.md not found in ${bookDirPath}`);
      }
    }
  }

  return books;
}

// মাল্টিপল মান (কমা/সেমিকোলন/পাইপ বা অবজেক্ট) সঠিকভাবে পার্স করার হেল্পার
function addValuesToSet(targetSet, rawValue) {
  if (!rawValue) return;

  const processSingleString = (str) => {
    // কমা (,), সেমিকোলন (;), বা পাইপ (|) দিয়ে স্প্লিট করা
    const parts = String(str).split(/[,;|]/);
    parts.forEach((p) => {
      const cleaned = normalizeText(p);
      if (cleaned) {
        targetSet.add(cleaned);
      }
    });
  };

  if (Array.isArray(rawValue)) {
    rawValue.forEach((item) => {
      if (!item) return;
      if (typeof item === 'string') {
        processSingleString(item);
      } else if (typeof item === 'object') {
        const val = item.name || item.title || item.label || '';
        if (val) processSingleString(val);
      } else {
        processSingleString(String(item));
      }
    });
  } else if (typeof rawValue === 'object') {
    const val = rawValue.name || rawValue.title || rawValue.label || '';
    if (val) processSingleString(val);
  } else {
    processSingleString(rawValue);
  }
}

function generateLibraryFiles() {
  const books = readBooks();

  // ১. মোট বই
  const totalBooks = books.length;

  // ২. মোট অথর কাউন্ট (লেখক, সম্পাদক, অনুবাদক সহ)
  const authorsSet = new Set();
  books.forEach((book) => {
    addValuesToSet(authorsSet, book.author);
    addValuesToSet(authorsSet, book.authors);
    addValuesToSet(authorsSet, book.author_name);
    addValuesToSet(authorsSet, book.writer);
    addValuesToSet(authorsSet, book.translator);
    addValuesToSet(authorsSet, book.translators);
    addValuesToSet(authorsSet, book.translator_name);
    addValuesToSet(authorsSet, book.editor);
    addValuesToSet(authorsSet, book.editors);
    addValuesToSet(authorsSet, book.editor_name);
  });

  // ৩. মোট সিরিজ কাউন্ট (series এবং series_list উভয়ই পার্স করা হচ্ছে)
  const seriesSet = new Set();
  books.forEach((book) => {
    addValuesToSet(seriesSet, book.series);
    addValuesToSet(seriesSet, book.series_list);
  });

  // ৪. মোট জঁরা/ঘরানা কাউন্ট
  const genresSet = new Set();
  books.forEach((book) => {
    addValuesToSet(genresSet, book.genre);
    addValuesToSet(genresSet, book.genres);
    addValuesToSet(genresSet, book.category);
    addValuesToSet(genresSet, book.categories);
  });

  // ৫. মোট ইউনিক আইটেম / প্রকরণ কাউন্ট
  const itemsSet = new Set();
  books.forEach((book) => {
    if (book.extractedItems && Array.isArray(book.extractedItems)) {
      book.extractedItems.forEach((itemName) => {
        const cleaned = normalizeText(itemName);
        if (cleaned) itemsSet.add(cleaned);
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

  // ১. library-stats.ts ফাইল তৈরি
  const statsContent = `// ⚠️ AUTO-GENERATED FILE
// Generated by scripts/generate-library-data.js
// Do not edit manually.

export const libraryStats = ${JSON.stringify(libraryStats, null, 2)} as const;

export default libraryStats;
`;

  // ২. library-data.ts ফাইল তৈরি
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