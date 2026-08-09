import fs from 'fs';

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
let spSizes = new Set();
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let matches = content.match(/[0-9]+(?:\.[0-9]+)?\.sp/g);
    if(matches) matches.forEach(m => spSizes.add(m));
});

console.log(Array.from(spSizes).sort((a,b) => parseFloat(a) - parseFloat(b)));
