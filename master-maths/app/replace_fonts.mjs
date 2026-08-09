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

const files = walkDir('/app/src/main/java/com/example/ui');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('FontFamily')) {
            let isHeader = false;
            if (line.includes('FontWeight.Bold') || line.includes('FontWeight.ExtraBold') || line.includes('FontWeight.Black')) {
                isHeader = true;
            }
            const sizeMatch = line.match(/fontSize\s*=\s*(\d+)\.sp/);
            if (sizeMatch && parseInt(sizeMatch[1]) >= 14) {
                isHeader = true;
            }
            if (isHeader) {
                line = line.replace(/FontFamily\.[A-Za-z]+/g, 'com.example.ui.theme.AllertaStencilFamily');
            } else {
                line = line.replace(/FontFamily\.[A-Za-z]+/g, 'com.example.ui.theme.ArialNarrowFamily');
            }
            if (lines[i] !== line) {
                lines[i] = line;
                changed = true;
            }
        }
    }
    if (changed) {
        fs.writeFileSync(file, lines.join('\n'), 'utf8');
    }
});
console.log('Fonts replaced successfully');
