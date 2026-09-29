const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Create the SVG Content for Dual-GST Tax Invoice Engine
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient: Premium Indigo to Deep Violet -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="45%" stop-color="#4338CA" />
      <stop offset="100%" stop-color="#312E81" />
    </linearGradient>

    <!-- Document Gradient: Clean Crisp Paper with subtle depth -->
    <linearGradient id="docGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>

    <!-- Emerald Success/GST Badge Gradient -->
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <!-- Subtle Drop Shadow -->
    <filter id="docShadow" x="-15%" y="-15%" width="130%" height="135%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#1E1B4B" flood-opacity="0.38" />
    </filter>

    <filter id="badgeShadow" x="-25%" y="-25%" width="150%" height="150%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#064E3B" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Squircle Base App Icon Shape -->
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />

  <!-- Subtle Rim Light / Inner Border -->
  <rect x="6" y="6" width="500" height="500" rx="114" fill="none" stroke="#A5B4FC" stroke-width="4" stroke-opacity="0.25" />

  <!-- Invoice Document Sheet -->
  <g filter="url(#docShadow)">
    <!-- Document Body -->
    <rect x="110" y="80" width="292" height="344" rx="28" fill="url(#docGrad)" />

    <!-- Top Decorative Header Bar -->
    <path d="M 110,108 A 28,28 0 0,1 138,80 L 374,80 A 28,28 0 0,1 402,108 L 402,148 L 110,148 Z" fill="#EEF2FF" />

    <!-- Header Invoice Emblem (Receipt Icon / Notch) -->
    <rect x="146" y="104" width="76" height="20" rx="10" fill="#4F46E5" />
    <circle cx="346" cy="114" r="8" fill="#6366F1" />
    <circle cx="368" cy="114" r="8" fill="#A5B4FC" />

    <!-- Invoice Content Line 1 (Customer / Bill To) -->
    <rect x="146" y="174" width="130" height="18" rx="9" fill="#64748B" />
    <rect x="320" y="174" width="46" height="18" rx="9" fill="#94A3B8" />

    <!-- Invoice Content Line 2 (Item Row 1) -->
    <rect x="146" y="210" width="156" height="16" rx="8" fill="#94A3B8" />
    <rect x="326" y="210" width="40" height="16" rx="8" fill="#CBD5E1" />

    <!-- Invoice Content Line 3 (Item Row 2) -->
    <rect x="146" y="242" width="118" height="16" rx="8" fill="#CBD5E1" />
    <rect x="326" y="242" width="40" height="16" rx="8" fill="#CBD5E1" />

    <!-- Separator Dotted Line -->
    <line x1="146" y1="278" x2="366" y2="278" stroke="#E2E8F0" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 12" />

    <!-- Total Row: Bold Accent Bar for Indian Rupee / Total -->
    <rect x="146" y="304" width="96" height="22" rx="11" fill="#1E293B" />
    <rect x="282" y="300" width="84" height="28" rx="14" fill="#4F46E5" />

    <!-- White Rupee Symbol on Total Bar -->
    <g transform="translate(296, 306) scale(0.65)" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 3h14M6 8h14M6 13l8 9M6 13h4a4 4 0 0 0 0-8" />
    </g>
  </g>

  <!-- Floating GST Verified Badge (Lower-Right) -->
  <g filter="url(#badgeShadow)">
    <circle cx="392" cy="392" r="54" fill="url(#badgeGrad)" stroke="#FFFFFF" stroke-width="10" />
    <!-- Checkmark icon inside badge -->
    <path d="M 374,392 L 387,405 L 413,377" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`;

async function createFavicons() {
  const publicDir = path.resolve(__dirname, '../public');

  // Save favicon.svg
  const svgPath = path.join(publicDir, 'favicon.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('Saved favicon.svg');

  // Render PNG sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 }
  ];

  const pngBuffers = {};

  for (const s of sizes) {
    const buf = await sharp(Buffer.from(svgContent))
      .resize(s.size, s.size)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, s.name), buf);
    pngBuffers[s.size] = buf;
    console.log(`Generated ${s.name} (${s.size}x${s.size})`);
  }

  // Generate multi-resolution favicon.ico containing 16x16, 32x32, and 48x48
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const headerSize = 6;
  const entrySize = 16;
  let currentOffset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const entries = [];
  const datas = [];

  for (const size of icoSizes) {
    const png = pngBuffers[size];
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(png.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset

    entries.push(entry);
    datas.push(png);
    currentOffset += png.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...datas]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Generated favicon.ico (multi-res 16, 32, 48)');

  // Also create site.webmanifest for PWA / Android / bookmarks
  const manifest = {
    name: "Dual-GST Tax Invoice Engine",
    short_name: "GST Invoice",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ],
    theme_color: "#4f46e5",
    background_color: "#0f172a",
    display: "standalone"
  };

  fs.writeFileSync(
    path.join(publicDir, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log('Generated site.webmanifest');
}

createFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
