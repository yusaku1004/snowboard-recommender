// ボードのウエスト幅（mm）の読み取りと、ブーツサイズに対する目安の判定。
// scripts/update_rakuten.ts から Node で直接読み込むため、型以外の import をしないこと。

// src/types の BootSize と同じ（Node から読み込むため import しない）
type BootSize = "small" | "medium" | "large";

// 長さ(cm) → ウエスト幅(mm)。JSON のキーになるため長さは文字列
export type WaistWidths = Record<string, number>;

// ブーツサイズごとのウエスト幅の目安（これ未満だとつま先・かかとが雪面に当たりやすい）
export const WAIST_GUIDE: Record<Exclude<BootSize, "small">, { bootLabel: string; minMm: number }> = {
  medium: { bootLabel: "27〜27.5cm", minMm: 255 },
  large: { bootLabel: "28cm以上", minMm: 260 },
};

// ---- 楽天の商品説明からの読み取り ----

// cm 表記（23.8 など）は mm に直す。ボードのウエスト幅としてありえる範囲だけ通す
function toMm(value: string, unit?: string): number | null {
  let n = Number(value);
  if (unit === "cm" || (!unit && n < 40)) n *= 10;
  return n >= 200 && n <= 320 ? Math.round(n) : null;
}

const SIZE = "(1[2-8]\\d(?:\\.\\d)?)";
const WAIST_WORD = "(?:WAIST(?:[- ]?W(?:IDTH)?)?|Waist(?: width| Wide)?|ウエスト幅?|ウェスト幅?)";

// 説明文から [長さ(cm), ウエスト幅(mm)] の組を読み取る。ワイド（153W など）は除く
export function extractWaistPairs(caption: string): [number, number][] {
  const text = caption.normalize("NFKC").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const pairs: [number, number][] = [];

  // 表形式: 【全長/ノーズ幅/ウエスト幅/...】・149cm/289mm/248mm/...
  for (const header of text.matchAll(/【([^】]*(?:ウエスト|ウェスト)[^】]*)】/g)) {
    const cols = header[1].split("/").map((s) => s.trim());
    const waistCol = cols.findIndex((c) => /ウエスト|ウェスト/.test(c));
    const lengthCol = cols.findIndex((c) => /全長|サイズ|長さ|レングス/.test(c));
    if (waistCol < 0 || lengthCol < 0) continue;
    const start = (header.index ?? 0) + header[0].length;
    for (const row of text.slice(start, start + 1500).matchAll(/・\s*([^・▲■【]+)/g)) {
      const cells = row[1].trim().split("/").map((s) => s.trim());
      const len = cells[lengthCol]?.match(/^(1[2-8]\d(?:\.\d)?)\s*(W)?/);
      const waist = cells[waistCol]?.match(/^(\d{2,3}(?:\.\d+)?)\s*(mm|cm)?/);
      if (!len || !waist || len[2]) continue;
      const mm = toMm(waist[1], waist[2]);
      if (mm) pairs.push([Number(len[1]), mm]);
    }
  }

  // 項目形式: "SIZE:140 WAIST WIDTH:23.8" "サイズ(cm):147 有効エッジ(cm):110.0 ウエスト幅(cm):24.8"
  // （サイズ表記からウエスト幅までの間に、別のサイズ表記をはさまないもの）
  const field = new RegExp(
    `(?:SIZE|LENGTH|サイズ|Sizes?|全長|【)\\s*(?:\\(cm\\))?\\s*[:：]?\\s*${SIZE}\\s*(W)?\\s*(?:cm)?` +
      `(?:(?!SIZE|LENGTH|サイズ|Sizes?\\b|【\\s*1[2-8]\\d).){0,90}?` +
      `${WAIST_WORD}\\s*(?:\\((mm|cm)\\))?\\s*[:：/]?\\s*(\\d{2,3}(?:\\.\\d+)?)\\s*(mm|cm)?`,
    "gi"
  );
  for (const m of text.matchAll(field)) {
    if (m[2]) continue;
    const mm = toMm(m[4], m[3] || m[5]);
    if (mm) pairs.push([Number(m[1]), mm]);
  }

  // 括弧形式: "150cm( 有効エッジ長/1170mm ウエスト幅/247mm ...)"
  for (const m of text.matchAll(new RegExp(`${SIZE}\\s*cm\\s*[(（]\\s*[^)）]{0,60}?(?:ウエスト|ウェスト)幅?\\s*[/:：]?\\s*(\\d{2,3}(?:\\.\\d+)?)\\s*(mm|cm)?`, "g"))) {
    const mm = toMm(m[2], m[3]);
    if (mm) pairs.push([Number(m[1]), mm]);
  }
  // 同じ記載を複数の形式で読んだ重複を除く
  const seen = new Set<string>();
  return pairs.filter(([l, w]) => !seen.has(`${l}|${w}`) && !!seen.add(`${l}|${w}`));
}

// 読み取った組を、ボードのサイズ展開に合わせて整理する。
// - データにある長さ（無ければ ±1cm）だけ残す（有効エッジなどを長さと取り違えたものを除く）
// - 同じ長さに複数の値があれば中央値
// - 短いサイズの方が次のサイズより明らかに広いものは、ワイド版の混入として除く
export function cleanWaistWidths(pairs: [number, number][], lengths: number[]): WaistWidths {
  const byLength = new Map<number, number[]>();
  for (const length of lengths) {
    // 長さが一致する値を優先し、無いときだけ ±1cm（154 と 153.5 などの表記揺れ）を使う
    const exact = pairs.filter(([l]) => Math.round(l) === length).map(([, w]) => w);
    const values = exact.length ? exact : pairs.filter(([l]) => Math.abs(l - length) <= 1).map(([, w]) => w);
    if (values.length) byLength.set(length, values.sort((a, b) => a - b));
  }
  const points = [...byLength]
    .sort((a, b) => a[0] - b[0])
    .map(([length, values]) => [length, values[Math.floor(values.length / 2)]] as const);
  return Object.fromEntries(
    points.filter(([, w], i) => !(i < points.length - 1 && w > points[i + 1][1] + 3)).map(([l, w]) => [String(l), w])
  );
}

// ---- 表示・判定 ----

// 指定した長さのウエスト幅（無ければ ±1cm 以内の長さの値）
export function waistAt(widths: WaistWidths | undefined, length: number): number | null {
  if (!widths) return null;
  for (const l of [length, length - 1, length + 1]) {
    const w = widths[String(l)];
    if (w) return w;
  }
  return null;
}

// ボードのサイズ展開ごとのウエスト幅（値がわかる長さだけ）。年式によってサイズ展開が違うため、表示はこれを使う
export function waistsForLengths(widths: WaistWidths | undefined, lengths: number[]): [number, number][] {
  return lengths.map((l) => [l, waistAt(widths, l)] as const).filter((x): x is [number, number] => x[1] !== null);
}

// ブーツサイズに対して、ウエスト幅が目安を満たすか（ブーツ未入力・小さめなら判定しない）
export function waistFit(waistMm: number | null, bootSize: BootSize | undefined): "ok" | "narrow" | null {
  if (waistMm === null || !bootSize || bootSize === "small") return null;
  return waistMm >= WAIST_GUIDE[bootSize].minMm ? "ok" : "narrow";
}
