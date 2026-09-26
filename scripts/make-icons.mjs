// Иконки приложения из рукописной буквы Ա (public/img/handwriting/ayb-upper.svg, CC BY-SA 4.0).
// Запуск: node scripts/make-icons.mjs — результат коммитится в public/.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const BG = "#c2410c";
const src = readFileSync("public/img/handwriting/ayb-upper.svg", "utf8");
const ink = src.match(/<g class="ink"[^>]*>(.*?)<\/g>/s)[1];
const GLYPH = { x: 55, y: 40, w: 210, h: 290 }; // рамка буквы в координатах исходного файла

/** SVG 512×512: фон (скруглённый или во весь квадрат) и белая буква высотой glyphH. */
function svg({ rounded, glyphH }) {
  const w = (GLYPH.w / GLYPH.h) * glyphH;
  const x = (512 - w) / 2;
  const y = (512 - glyphH) / 2;
  const bg = rounded ? `<rect width="512" height="512" rx="112" fill="${BG}"/>` : `<rect width="512" height="512" fill="${BG}"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}` +
    `<svg x="${x}" y="${y}" width="${w}" height="${glyphH}" viewBox="${GLYPH.x} ${GLYPH.y} ${GLYPH.w} ${GLYPH.h}">` +
    `<g fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">${ink}</g></svg></svg>`
  );
}

mkdirSync("public/icons", { recursive: true });
const png = (s, size, file) => sharp(Buffer.from(s)).resize(size, size).png().toFile(file);

const regular = svg({ rounded: true, glyphH: 330 });
const full = svg({ rounded: false, glyphH: 330 });
const maskable = svg({ rounded: false, glyphH: 250 }); // буква в безопасной зоне (центральные 80%)

writeFileSync("public/favicon.svg", regular + "\n");
await png(regular, 192, "public/icons/icon-192.png");
await png(regular, 512, "public/icons/icon-512.png");
await png(maskable, 512, "public/icons/maskable-512.png");
await png(full, 180, "public/icons/apple-touch-icon.png"); // iOS сам скругляет углы
console.log("icons ok");
