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
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // replace 7.sp to 7.5.sp
    let newContent = content.replace(/\b7\.sp\b/g, () => {
        changed = true;
        return `7.5.sp`;
    });
    // replace 8.sp to 8.5.sp
    newContent = newContent.replace(/\b8\.sp\b/g, () => {
        changed = true;
        return `8.5.sp`;
    });
    newContent = newContent.replace(/\b9\.sp\b/g, () => {
        changed = true;
        return `9.5.sp`;
    });
    newContent = newContent.replace(/\b10\.sp\b/g, () => {
        changed = true;
        return `10.5.sp`;
    });

    if (changed) {
        fs.writeFileSync(file, newContent, 'utf8');
    }
});
console.log('Fonts updated successfully.');
