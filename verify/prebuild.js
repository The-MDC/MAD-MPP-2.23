const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
console.log('Prebuild: Cleaned out/ and dist/ directories.');
