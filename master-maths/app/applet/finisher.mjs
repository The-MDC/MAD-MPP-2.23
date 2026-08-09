import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('.kt')) results.push(file);
        }
    });
    return results;
}

const files = walkDir('/app/src/main/java');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Reduce blur
    content = content.replace(/blurRadius\s*=\s*24f/g, 'blurRadius = 16f');
    content = content.replace(/blurRadius\s*=\s*16f/g, 'blurRadius = 11f');
    content = content.replace(/blurRadius\s*=\s*12f/g, 'blurRadius = 8f');
    content = content.replace(/blurRadius\s*=\s*8f/g, 'blurRadius = 5f');

    // Also do the header fonts as requested previously to AllertaStencilFamily
    let lines = content.split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('ArialNarrowFamily')) {
            let isHeader = false;
            if (line.includes('FontWeight.Bold') || line.includes('FontWeight.ExtraBold') || line.includes('FontWeight.Black') || line.includes('FontWeight.SemiBold')) {
                isHeader = true;
            }
            const sizeMatch = line.match(/fontSize\s*=\s*(\d+)\.sp/);
            if (sizeMatch && parseInt(sizeMatch[1]) >= 14) {
                isHeader = true;
            }
            if (isHeader) {
                 line = line.replace(/com\.example\.ui\.theme\.ArialNarrowFamily/g, 'com.example.ui.theme.AllertaStencilFamily');
            }
            if (lines[i] !== line) {
                lines[i] = line;
            }
        }
    }

    fs.writeFileSync(file, lines.join('\n'), 'utf8');
});
console.log('done!');
