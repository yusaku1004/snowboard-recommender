import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "../src/data/boards_data.json");
const outputPath = path.join(__dirname, "../boards_data.csv");

const boards = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const headers = [
  "brand",
  "model",
  "year",
  "flex",
  "shape",
  "price",
  "available_lengths",
  "ground_tricks",
  "park",
  "carving",
  "run_tricks",
  "powder",
  "image_url",
  "url",
];

const rows = boards.map((b: any) => [
  b.brand ?? "",
  b.model ?? "",
  b.year ?? "",
  b.flex ?? "",
  b.shape ?? "",
  b.price ?? "",
  (b.available_lengths ?? []).join(" / "),
  b.style_scores?.ground_tricks ?? "",
  b.style_scores?.park ?? "",
  b.style_scores?.carving ?? "",
  b.style_scores?.run_tricks ?? "",
  b.style_scores?.powder ?? "",
  b.image_url ?? "",
  b.url ?? "",
]);

const escape = (v: any) => {
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const csv = [headers, ...rows]
  .map((row) => row.map(escape).join(","))
  .join("\n");

fs.writeFileSync(outputPath, "\uFEFF" + csv, "utf-8"); // BOM付きでExcelの文字化けを防ぐ
console.log(`出力完了: ${outputPath} (${boards.length}件)`);
