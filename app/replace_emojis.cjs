const fs = require('fs');
const path = require('path');

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

const files = walkDir(path.join(__dirname, 'app/src/main/java'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace Emojis
    content = content.replace(/🔥 TOP TRENDING MARKETS/g, "☠️ ALPHA REPOSITORIES");
    content = content.replace(/⚡ CUSTOM KPIs/g, "⚙️ NEURAL TELEMETRY");
    content = content.replace(/🔥 84%/g, "☣️ 84%");
    content = content.replace(/📉 Decrementing Price/g, "🩸 Decrementing Price");
    content = content.replace(/🛡️ MAD SHIELD™/g, "⚔️ MAD SHIELD™ EXECUTOR");
    content = content.replace(/🛰️ KAITO SENTIMENT PORTAL/g, "👁️‍🗨️ KAITO SENTIMENT PORTAL");
    content = content.replace(/🧠 AUDIENCE BIAS/g, "🧬 COGNITIVE BIAS");
    content = content.replace(/📈 MARKET VOLATILITY/g, "🫀 MARKET VOLATILITY");
    content = content.replace(/12 🔥/g, "12 💀");

    content = content.replace(/🔥/g, '☣️');
    content = content.replace(/⚡/g, '⛓️');
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Emojis replaced');
