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

const files = walkDir('app/src/main/java/com/example/ui');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    let newContent = content.replace(/\.border\(0\.5\.dp,\s*GoldFlakeBrush/g, () => {
        changed = true;
        return `.border(1.dp, GoldFlakeBrush`;
    });
    newContent = newContent.replace(/\.border\(0\.5\.dp,\s*IntenseGoldFlakeBrush/g, () => {
        changed = true;
        return `.border(1.dp, IntenseGoldFlakeBrush`;
    });

    if (changed) {
        fs.writeFileSync(file, newContent, 'utf8');
    }
});
console.log('Successfully updated GoldFlake borders to 0.5.dp');
