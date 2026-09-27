// Картинки к словам из ARASAAC (docs/04-content.md, 4.5).
// Пиктограммы: Sergio Palao, ARASAAC (Правительство Арагона), лицензия CC BY-NC-SA 4.0 —
// ТОЛЬКО некоммерческое использование. При монетизации приложения их нужно заменить.
//
//   node scripts/arasaac.mjs search <слово>        — найти пиктограммы по-русски (номера и ссылки для просмотра)
//   node scripts/arasaac.mjs set <id-слова> <номер> — поставить слову пиктограмму (скачивается сама)
//        [--ru]                                    — слово из content/ru/words.json (иначе — армянский банк слов)
//   node scripts/arasaac.mjs apply <файл.json>      — много слов сразу: [{ "id": "...", "pid": 123, "ru": false }]
//   node scripts/arasaac.mjs fetch                  — скачать недостающие файлы для всех слов с картинками ARASAAC
//   node scripts/arasaac.mjs missing                — какие слова пока без картинок

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const FILES = { hy: "content/words/words.json", ru: "content/ru/words.json" };
const IMG_DIR = "img/words";
const SIZE = 256;

export const IMAGE_META = { source: "ARASAAC", license: "CC BY-NC-SA 4.0", author: "Sergio Palao (ARASAAC, Правительство Арагона)" };

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const writeJson = (rel, data) => fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(data, null, 2) + "\n");
const fileOf = (pid) => `${IMG_DIR}/arasaac-${pid}.webp`;

async function search(word) {
  const res = await fetch(`https://api.arasaac.org/api/pictograms/ru/search/${encodeURIComponent(word)}`);
  if (!res.ok) return [];
  return (await res.json()).map((p) => ({ pid: p._id, keywords: p.keywords.map((k) => k.keyword).filter(Boolean) }));
}

/** Скачивает пиктограмму и сохраняет квадратной картинкой WebP 256×256 (прозрачный фон). */
async function download(pid) {
  const out = path.join(ROOT, "public", fileOf(pid));
  if (fs.existsSync(out)) return;
  const res = await fetch(`https://static.arasaac.org/pictograms/${pid}/${pid}_500.png`);
  if (!res.ok) throw new Error(`Пиктограмма ${pid} не скачалась: ${res.status}`);
  const png = Buffer.from(await res.arrayBuffer());
  await sharp(png).resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 85 }).toFile(out);
}

async function setImages(list) {
  const data = { hy: readJson(FILES.hy), ru: readJson(FILES.ru) };
  for (const { id, pid, ru } of list) {
    const bank = data[ru ? "ru" : "hy"];
    const word = bank.find((w) => w.id === id);
    if (!word) throw new Error(`Нет слова «${id}» в ${FILES[ru ? "ru" : "hy"]}`);
    await download(pid);
    word.image = { file: fileOf(pid), ...IMAGE_META };
    console.log(`${word.ru} → ${fileOf(pid)}`);
  }
  writeJson(FILES.hy, data.hy);
  writeJson(FILES.ru, data.ru);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "search") {
  for (const p of (await search(args.join(" "))).slice(0, 10)) {
    console.log(`${p.pid}\t${p.keywords.slice(0, 3).join(", ")}\thttps://static.arasaac.org/pictograms/${p.pid}/${p.pid}_300.png`);
  }
} else if (cmd === "set" && args[0] && args[1]) {
  await setImages([{ id: args[0], pid: Number(args[1]), ru: args.includes("--ru") }]);
} else if (cmd === "apply" && args[0]) {
  await setImages(JSON.parse(fs.readFileSync(args[0], "utf8")));
} else if (cmd === "fetch") {
  for (const rel of Object.values(FILES)) {
    for (const w of readJson(rel)) {
      const m = w.image?.source === "ARASAAC" && /arasaac-(\d+)\./.exec(w.image.file);
      if (m) await download(Number(m[1]));
    }
  }
  console.log("Готово");
} else if (cmd === "missing") {
  for (const [kind, rel] of Object.entries(FILES)) for (const w of readJson(rel)) if (!w.image) console.log(`${kind}\t${w.id}\t${w.ru}`);
} else {
  console.log("Команды: search <слово> | set <id> <номер> [--ru] | apply <файл.json> | fetch | missing");
}
