/**
 * Generátor PNG ikon ze zdrojového SVG (public/icon.svg).
 * Produkuje: favicon-32/16, apple-touch-icon, pwa-192, pwa-512, pwa-512-maskable.
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const PUBLIC_DIR = resolve(PROJECT_ROOT, 'public');

const BACKGROUND_HEX = '#0f172a';

/**
 * Generuje výstupní PNG z SVG bufferu v zadané velikosti.
 * Maskable: ikonu zmenší do 60 % plátna s tmavým okrajem (safe zone pro OS mask).
 */
async function renderIcon({ svg, size, outPath, maskable = false }) {
  if (!maskable) {
    await sharp(svg, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(outPath);
    return;
  }

  const safeSize = Math.round(size * 0.7);
  const pad = Math.round((size - safeSize) / 2);

  const inner = await sharp(svg, { density: 384 })
    .resize(safeSize, safeSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND_HEX,
    },
  })
    .composite([{ input: inner, top: pad, left: pad }])
    .png()
    .toFile(outPath);
}

async function main() {
  const svg = await readFile(resolve(PUBLIC_DIR, 'icon.svg'));

  const targets = [
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  ];

  for (const t of targets) {
    const outPath = resolve(PUBLIC_DIR, t.name);
    await renderIcon({
      svg,
      size: t.size,
      outPath,
      maskable: Boolean(t.maskable),
    });
    console.log(`  ✓ ${t.name} (${t.size}×${t.size}${t.maskable ? ', maskable' : ''})`);
  }

  console.log('\nHotovo. Ikony jsou v public/.');
}

await main();
