const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = 'dark-gotchi';
const DIST_DIR = 'dist';

function cleanDist() {
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST_DIR);
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        // Minify JS/CSS/JSON if needed
        if (src.endsWith('.js')) {
            minifyJS(src, dest);
        } else if (src.endsWith('.css')) {
            minifyCSS(src, dest);
        } else if (src.endsWith('.json')) {
            minifyJSON(src, dest);
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}

function minifyJS(src, dest) {
    let content = fs.readFileSync(src, 'utf8');
    // Simple minification: remove comments and whitespace
    // Note: This is a very naive regex minifier. For production, use Terser.
    // Removing single line comments // ...
    content = content.replace(/\/\/[^\n]*/g, '');
    // Removing multi line comments /* ... */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove empty lines
    content = content.replace(/^\s*[\r\n]/gm, '');

    // We keep newlines to avoid breaking ASI (Automatic Semicolon Insertion) if code is sloppy,
    // but strict minifiers remove them. We'll be safe and just trim.

    fs.writeFileSync(dest, content);
}

function minifyCSS(src, dest) {
    let content = fs.readFileSync(src, 'utf8');
    // Remove comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove whitespace
    content = content.replace(/\s+/g, ' ');
    fs.writeFileSync(dest, content);
}

function minifyJSON(src, dest) {
    let content = fs.readFileSync(src, 'utf8');
    try {
        const json = JSON.parse(content);
        fs.writeFileSync(dest, JSON.stringify(json));
    } catch (e) {
        console.warn(`Failed to minify JSON ${src}, copying as is.`);
        fs.copyFileSync(src, dest);
    }
}

console.log('Building...');
cleanDist();
copyRecursiveSync(SRC_DIR, DIST_DIR);
console.log('Build complete.');

try {
    console.log('Zipping...');
    // We want the zip to contain the contents of dist, not the dist folder itself.
    execSync(`cd ${DIST_DIR} && zip -r ../dist.zip ./*`);
    console.log('Zip created: dist.zip');
} catch (e) {
    console.warn('Failed to zip (zip command might be missing).');
}
