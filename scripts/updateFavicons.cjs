const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const png = fs.readFileSync(path.join(publicDir, 'favicon.png'));
const base64 = png.toString('base64');

// 1. Update favicon.svg with Mekara Symbol
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <image href="data:image/png;base64,${base64}" width="64" height="64" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg, 'utf8');
console.log('Updated public/favicon.svg successfully');

// 2. Generate public/favicon.ico
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // ICO type
header.writeUInt16LE(1, 4); // 1 image
header.writeUInt8(64, 6);   // width
header.writeUInt8(64, 7);   // height
header.writeUInt8(0, 8);    // color count
header.writeUInt8(0, 9);    // reserved
header.writeUInt16LE(1, 10); // planes
header.writeUInt16LE(32, 12); // bpp
header.writeUInt32LE(png.length, 14); // size
header.writeUInt32LE(22, 18); // offset
const ico = Buffer.concat([header, png]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
console.log('Generated public/favicon.ico successfully');
