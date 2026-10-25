import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy public assets to dist
if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
}

// Ensure an index.html exists in dist for Vite/static Vercel validators
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Webby</title></head><body></body></html>\n');
}

console.log('✓ Successfully populated dist directory for Vercel.');
