// CSV（export_csv.ts と同じ列）から新しいボードを src/data/boards_data.json に取り込む。
//
//   node scripts/import_csv.ts new_models.csv            取り込む
//   node scripts/import_csv.ts new_models.csv --dry-run  チェックと差分の確認だけ
//
// 列: brand, model, year, gender, flex, shape, price, available_lengths（"150 / 154 / 158"）,
//     ground_tricks, park, carving, run_tricks, powder, image_url, url
// 同じ brand + model + year が既にあれば上書き、無ければ追加する。

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Board, BoardGender, Shape } from "../src/types/index.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE = path.join(ROOT, "src/data/boards_data.json");
const SHAPES: Shape[] = ["camber", "rocker", "flat", "hybrid_camber", "hybrid_rocker", "double_camber"];
const GENDERS: BoardGender[] = ["mens", "womens", "unisex"];

const [csvPath, ...flags] = process.argv.slice(2);
if (!csvPath) {
  console.error("使い方: node scripts/import_csv.ts <CSVファイル> [--dry-run]");
  process.exit(1);
}

// ダブルクォート・カンマ・改行を含む CSV を読む
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

const [header, ...lines] = parseCsv(fs.readFileSync(csvPath, "utf-8"));
const col = (name: string) => {
  const i = header.map((h) => h.trim()).indexOf(name);
  if (i < 0) { console.error(`列 "${name}" がありません`); process.exit(1); }
  return i;
};
const C = Object.fromEntries(
  ["brand", "model", "year", "gender", "flex", "shape", "price", "available_lengths", "ground_tricks", "park", "carving", "run_tricks", "powder", "image_url", "url"].map((n) => [n, n === "image_url" || n === "url" ? header.indexOf(n) : col(n)])
) as Record<string, number>;

const errors: string[] = [];
const intIn = (v: string, min: number, max: number, label: string, line: number) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) errors.push(`${line}行目: ${label} は ${min}〜${max} の整数（"${v}"）`);
  return n;
};

const imported: Board[] = lines.map((cells, idx) => {
  const line = idx + 2;
  const v = (name: string) => (C[name] >= 0 ? (cells[C[name]] ?? "").trim() : "");
  const shape = v("shape") as Shape;
  const gender = v("gender") as BoardGender;
  if (!v("brand") || !v("model")) errors.push(`${line}行目: brand / model が空です`);
  if (!SHAPES.includes(shape)) errors.push(`${line}行目: shape は ${SHAPES.join(" / ")}（"${shape}"）`);
  if (!GENDERS.includes(gender)) errors.push(`${line}行目: gender は ${GENDERS.join(" / ")}（"${gender}"）`);
  const lengths = v("available_lengths").split(/[\/\s,]+/).filter(Boolean).map(Number);
  if (lengths.length === 0 || lengths.some((n) => !Number.isInteger(n) || n < 90 || n > 200)) {
    errors.push(`${line}行目: available_lengths は "150 / 154 / 158" の形式（"${v("available_lengths")}"）`);
  }
  const board: Board = {
    brand: v("brand"),
    model: v("model"),
    year: intIn(v("year"), 2020, 2040, "year", line),
    flex: intIn(v("flex"), 1, 10, "flex", line),
    shape,
    gender,
    available_lengths: lengths,
    price: intIn(v("price"), 1000, 1000000, "price", line),
    style_scores: {
      ground_tricks: intIn(v("ground_tricks"), 1, 10, "ground_tricks", line),
      park: intIn(v("park"), 1, 10, "park", line),
      carving: intIn(v("carving"), 1, 10, "carving", line),
      run_tricks: intIn(v("run_tricks"), 1, 10, "run_tricks", line),
      powder: intIn(v("powder"), 1, 10, "powder", line),
    },
    ...(v("image_url") ? { image_url: v("image_url") } : {}),
    ...(v("url") ? { url: v("url") } : {}),
  };
  return board;
});

if (errors.length) {
  console.error(`入力エラー ${errors.length} 件（取り込みは行っていません）:\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

const data: Board[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
const key = (b: Board) => `${b.brand}|${b.model}|${b.year}`;
const index = new Map(data.map((b, i) => [key(b), i]));
let added = 0;
let updated = 0;
for (const board of imported) {
  const i = index.get(key(board));
  if (i === undefined) { data.push(board); index.set(key(board), data.length - 1); added++; }
  else { data[i] = { ...data[i], ...board }; updated++; }
}

console.log(`追加 ${added} 件 / 上書き ${updated} 件（CSV ${imported.length} 行）`);
if (flags.includes("--dry-run")) {
  console.log("--dry-run のためファイルは更新していません");
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + "\n");
  console.log(`更新しました: ${path.relative(ROOT, DATA_FILE)}`);
}
