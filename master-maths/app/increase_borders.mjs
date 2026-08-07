import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = dir + '/' + file;
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else {
            if (fullPath.endsWith('.kt')) results.push(fullPath);
        }
    });
    return results;
}

const files = walkDir('app/src/main/java');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Use replace with a reviver function
    const newContent = content.replace(/\.border\(\s*([\d.]+)\.dp/g, (match, p1) => {
        let val = parseFloat(p1);
        val = val + 0.5;
        // Format to avoiding 1.0.dp just do 1.5.dp
        changed = true;
        return `.border(${val}.dp`;
    });

    if (changed) {
        fs.writeFileSync(file, newContent, 'utf8');
    }
});
console.log('Borders successfully thickened by 0.5dp.');
