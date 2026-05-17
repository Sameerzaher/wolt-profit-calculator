/**
 * Generates PNG icons for PWA manifest (run: node scripts/generate-pwa-icons.mjs)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svg = readFileSync(join(root, "public", "icon.svg"));

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 }
];

for (const { name, size, maskable } of sizes) {
  let pipeline = sharp(svg).resize(size, size, { fit: "contain", background: "#020617" });
  if (maskable) {
    pipeline = pipeline.extend({
      top: Math.round(size * 0.1),
      bottom: Math.round(size * 0.1),
      left: Math.round(size * 0.1),
      right: Math.round(size * 0.1),
      background: "#020617"
    });
  }
  const buf = await pipeline.png().toBuffer();
  writeFileSync(join(root, "public", name), buf);
  console.log(`Wrote public/${name}`);
}
