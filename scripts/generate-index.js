const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(process.cwd(), 'content');
const DATA_DIR = path.join(process.cwd(), 'data');
const PAGES_DIR = path.join(DATA_DIR, 'pages');
const BOOKS_DATA_DIR = path.join(DATA_DIR, 'books');

// গন্তব্য ফোল্ডারগুলো নিশ্চিত করা
[DATA_DIR, PAGES_DIR, BOOKS_DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 🔄 রিফ্যাক্টর্ড: আইটেম বা আইটেমস ডেটাগুলোকে সবসময় একটি সুনির্দিষ্ট `items` অ্যারেতে রূপান্তর করা
function parseListField(field) {
  if (!field) return [];

  if (Array.isArray(field)) {
    return field
      .map((item) => {
        if (!item) return null;
        return typeof item === 'object' ? item : String(item).trim();
      })
      .filter(Boolean);
  }

  if (typeof field === 'object') {
    return [field];
  }

  return String(field)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// মার্কডাউন ফাইলগুলোকে রিকার্সিভলি জেসনে রূপান্তর করা
function convertMarkdownToJsonRecursively(currentDir) {
  if (!fs.existsSync(currentDir)) return;

  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullSourcePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      convertMarkdownToJsonRecursively(fullSourcePath);
    } else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) {
      try {
        const fileContent = fs.readFileSync(fullSourcePath, 'utf-8');
        const { data, content } = matter(fileContent);

        const relativePath = path.relative(CONTENT_DIR, fullSourcePath);
        const relativeJsonPath = relativePath.replace(/\.mdx?$/i, '.json');
        const outputJsonPath = path.join(DATA_DIR, relativeJsonPath);
        const outputFolder = path.dirname(outputJsonPath);

        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder, { recursive: true });
        }

        const ext = path.extname(entry.name);
        const fileNameWithoutExt = path.basename(entry.name, ext).toLowerCase();

        // ফ্রন্টমেটার থেকে item বা items তুলে নিয়ে একক items অ্যারে তৈরি করা
        const items = parseListField(data.item || data.items);

        // ফ্রন্টমেটার থেকে মূল `item` বা `items` প্রপার্টিগুলো ডিস্ট্রাক্ট করে বাদ দেওয়া, যাতে ডুপ্লিকেট না থাকে
        const { item: _ignoredItem, items: _ignoredItems, ...restData } = data;

        const jsonContent = {
          filename: entry.name,
          slug: data.slug || fileNameWithoutExt,
          title: data.title || 'শিরোনামহীন',
          ...restData,
          items, // সুনির্দিষ্টভাবে একবারই `items` অ্যারে যুক্ত হবে
          content: content.trim(),
          frontmatter: {
            ...restData,
            items,
          },
        };

        fs.writeFileSync(outputJsonPath, JSON.stringify(jsonContent, null, 2), 'utf-8');
        console.log(`Converted: ${relativePath} -> data/${relativeJsonPath}`);
      } catch (err) {
        console.error(`❌ Error processing file ${fullSourcePath}:`, err.message);
      }
    }
  }
}

// পেজ সাবফোল্ডারের জন্য ইনডেক্স ফাইল তৈরি করা
function generateAllPagesIndexes() {
  if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR, { recursive: true });
  }

  const mandatoryPages = ['about', 'success'];
  const entries = fs.readdirSync(PAGES_DIR, { withFileTypes: true });
  const existingFolders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  const targetFolders = Array.from(new Set([...existingFolders, ...mandatoryPages]));

  targetFolders.forEach((folderName) => {
    const currentFolder = path.join(PAGES_DIR, folderName);
    const indexOutputPath = path.join(PAGES_DIR, `${folderName}-index.json`);

    if (!fs.existsSync(currentFolder)) {
      fs.writeFileSync(indexOutputPath, JSON.stringify([], null, 2), 'utf-8');
      console.warn(`⚠️ Created fallback index: data/pages/${folderName}-index.json (directory not found)`);
      return;
    }

    try {
      const files = fs.readdirSync(currentFolder).filter((f) => f.endsWith('.json') && !f.endsWith('-index.json'));

      const indexData = files.map((file) => {
        const filePath = path.join(currentFolder, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(raw);
        const slug = file.replace('.json', '');

        return {
          slug,
          title: json.title || json.default?.title || slug,
          description: json.description || '',
          ...json,
        };
      });

      fs.writeFileSync(indexOutputPath, JSON.stringify(indexData, null, 2), 'utf-8');
      console.log(`✅ Generated: data/pages/${folderName}-index.json (${indexData.length} items)`);
    } catch (err) {
      console.error(`❌ Error generating ${folderName}-index.json:`, err.message);
      if (!fs.existsSync(indexOutputPath)) {
        fs.writeFileSync(indexOutputPath, JSON.stringify([], null, 2), 'utf-8');
      }
    }
  });
}

// 📚 রূপান্তরিত data/books ফোল্ডারের ভেতর থেকে books-index.json তৈরি করা
function generateAuthorsBooksIndexes() {
  if (!fs.existsSync(BOOKS_DATA_DIR)) {
    console.warn(`⚠️ Warning: 'data/books' directory not found.`);
    return;
  }

  const authorFolders = fs.readdirSync(BOOKS_DATA_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  authorFolders.forEach((author) => {
    const authorDirPath = path.join(BOOKS_DATA_DIR, author);

    const bookSubFolders = fs.readdirSync(authorDirPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    const booksList = [];

    bookSubFolders.forEach((bookFolder) => {
      const indexJsonPath = path.join(authorDirPath, bookFolder, 'index.json');

      if (fs.existsSync(indexJsonPath)) {
        try {
          const fileContent = fs.readFileSync(indexJsonPath, 'utf-8');
          const jsonData = JSON.parse(fileContent);

          booksList.push({
            slug: bookFolder,
            title: jsonData.title || 'শিরোনামহীন',
            ...jsonData,
          });
        } catch (err) {
          console.error(`❌ Error reading ${indexJsonPath}:`, err.message);
        }
      }
    });

    const outputPath = path.join(authorDirPath, 'books-index.json');
    fs.writeFileSync(outputPath, JSON.stringify(booksList, null, 2), 'utf-8');
    console.log(`📚 Generated: data/books/${author}/books-index.json (${booksList.length} books)`);
  });
}

// 🗂️ data/catalog.json এবং data/content-index.json তৈরি করা
function generateCatalogAndContentIndex() {
  const allJsonFiles = [];

  function scanJsonFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanJsonFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(content);
          const relativePath = path.relative(DATA_DIR, fullPath);

          allJsonFiles.push({
            path: relativePath,
            ...parsed,
          });
        } catch (err) {
          console.error(`❌ Error reading JSON file ${fullPath}:`, err.message);
        }
      }
    }
  }

  scanJsonFiles(DATA_DIR);

  const catalogPath = path.join(DATA_DIR, 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify(allJsonFiles, null, 2), 'utf-8');
  console.log(`📦 Generated: data/catalog.json (${allJsonFiles.length} entries)`);

  const contentIndexPath = path.join(DATA_DIR, 'content-index.json');
  fs.writeFileSync(contentIndexPath, JSON.stringify(allJsonFiles, null, 2), 'utf-8');
  console.log(`📋 Generated: data/content-index.json (${allJsonFiles.length} entries)`);
}

// স্ক্রিপ্ট এক্সিকিউশন
console.log('🚀 Starting content folder conversion to JSON...');
convertMarkdownToJsonRecursively(CONTENT_DIR);
console.log('✨ All markdown files successfully converted to JSON!\n');

console.log('📚 Generating page indexes...');
generateAllPagesIndexes();
console.log('🎉 Index generation completed successfully!\n');

console.log('📖 Generating authors books-index files...');
generateAuthorsBooksIndexes();
console.log('🎉 Authors books indexes generated successfully!\n');

console.log('🗂️ Generating catalog and content index files...');
generateCatalogAndContentIndex();
console.log('🎉 Catalog and content-index generated successfully!');