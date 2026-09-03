const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.md')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Regular expression to find inline items like item: { name: "...", link: "..." }
      const regex = /item:\s*\{\s*name:\s*"([^"]+)",\s*link:\s*"([^"]+)"\s*\}/g;
      
      if (regex.test(content)) {
        const updated = content.replace(regex, 'item:\n  name: "$1"\n  link: "$2"');
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  }
}

// আপনার কনটেন্ট বা বুকস ফোল্ডারের পাথ এখানে দিন (যেমন: './content' বা './books')
walkDir('./content');