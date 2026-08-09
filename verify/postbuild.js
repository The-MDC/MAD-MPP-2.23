const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const distDir = path.join(__dirname, 'dist');

if (fs.existsSync(outDir)) {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.cpSync(outDir, distDir, { recursive: true });
  console.log('Postbuild: Successfully copied out/ artifacts to dist/.');

  // Ensure all markdown documentation and handoff files are explicitly included in dist artifacts
  const filesToCopy = ['README.md', 'ANDROID_AI_PROMPT_HANDOFF.md'];
  filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(distDir, file));
      console.log(`Postbuild: Bundled ${file} into dist/.`);
    }
  });

  const docsSrc = path.join(__dirname, 'docs');
  const docsDest = path.join(distDir, 'docs');
  if (fs.existsSync(docsSrc)) {
    fs.cpSync(docsSrc, docsDest, { recursive: true });
    console.log('Postbuild: Bundled docs/ directory into dist/.');
  }
} else {
  console.error('Postbuild Error: out/ directory does not exist.');
  process.exit(1);
}
