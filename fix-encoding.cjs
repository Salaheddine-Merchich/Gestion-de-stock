const fs = require('fs');
const path = require('path');

const replacements = {
  'Ã©': 'é',
  'Ã ': 'à',
  'Ã¨': 'è',
  'Ã¹': 'ù',
  'Ã¢': 'â',
  'Ã«': 'ë',
  'Ã®': 'î',
  'Ã¯': 'ï',
  'Ã´': 'ô',
  'Ã»': 'û',
  'Ã§': 'ç',
  'â‚¬': '€',
  'Ã‰': 'É',
  'Ã€': 'À',
  'Ãˆ': 'È',
  'Ãš': 'Ù',
  'Ã‚': 'Â',
  'Ã‹': 'Ë',
  'ÃŽ': 'Î',
  'Ã”': 'Ô',
  'Ã›': 'Û',
  'Ã‡': 'Ç'
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      for (const [key, value] of Object.entries(replacements)) {
        if (content.includes(key)) {
          content = content.split(key).join(value);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
      }
    }
  });
}

walk(path.join(process.cwd(), 'src'));
