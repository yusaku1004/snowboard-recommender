// 楽天市場の検索結果から「このボードの出品」を見分けて、価格・画像を選ぶ。
// scripts/update_rakuten.ts から Node で直接読み込むため、型以外の import をしないこと。

export interface RakutenItem {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl?: string;
  mediumImageUrls?: (string | { imageUrl: string })[];
  shopName?: string;
  availability?: number;
}

export interface MatchedOffer {
  price: number;
  url: string;
  imageUrl?: string;
  itemName: string;
  shopName?: string;
  year: number | null;
  matchedCount: number;
}

// 全角→半角、小文字化、空白・記号を除去して比較しやすくする
export function normalizeName(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    // レディース表記の揺れ（Women's / Womens / W's / WMNS）をそろえる
    .replace(/\b(?:women'?s|wmns|w's)(?=[\s.\-_]|$)/g, "w")
    .replace(/[\s\-_.・'’"“”/\\()（）［］\[\]【】「」『』:：,，、。!！?？+＋&＆#＃*＊~〜]/g, "");
}

// ボード本体以外（ビンディング・ブーツ・小物・中古・セット販売）の出品を除外する
const EXCLUDE = /ビンディング|バインディング|binding|ブーツ|boots?\b|ケース|カバー|ワックス|wax|中古|used|アウトレット品|ソールガード|デッキパッド|ステッカー|リーシュ|セット|3点|２点|2点|三点|ジュニア用ビン|ウェア|ジャケット|パンツ|グローブ|ゴーグル|ヘルメット/i;
const BOARD_WORD = /スノーボード|スノボ|snowboard|ボード|板/i;

export function isBoardListing(itemName: string): boolean {
  return BOARD_WORD.test(itemName) && !EXCLUDE.test(itemName);
}

// 出品名からモデルの年式（シーズン末尾の年）を読み取る。例: "26-27" "2026-2027" "2027" → 2027
export function detectModelYear(itemName: string): number | null {
  const text = itemName.normalize("NFKC");
  const season = text.match(/(?:20)?(\d{2})\s*[-/〜~]\s*(?:20)?(\d{2})(?:\s*(?:モデル|model|年|シーズン|season))?/i);
  if (season) {
    const a = Number(season[1]);
    const b = Number(season[2]);
    if (b === a + 1 && a >= 20 && a <= 40) return 2000 + b;
  }
  const single = text.match(/20(2\d|3\d)(?:\s*(?:年|モデル|model))?/i);
  return single ? 2000 + Number(single[1]) : null;
}

// 楽天の画像URLは「?_ex=128x128」でサイズ指定できるため、表示用に大きめを指定する
export function upscaleImageUrl(url: string, size = 400): string {
  return url.includes("_ex=") ? url.replace(/_ex=\d+x\d+/, `_ex=${size}x${size}`) : `${url}${url.includes("?") ? "&" : "?"}_ex=${size}x${size}`;
}

function firstImage(item: RakutenItem): string | undefined {
  const first = item.mediumImageUrls?.[0];
  if (!first) return undefined;
  return upscaleImageUrl(typeof first === "string" ? first : first.imageUrl);
}

export interface MatchTarget {
  brand: string;
  model: string;
  // 同ブランドの全モデル名（"Custom" と "Custom Flying V" のような部分一致の取り違えを防ぐ）
  siblingModels: string[];
  // 参考定価（外れ値の除外に使う）
  referencePrice: number;
  // ブランド名の読み（カタカナ表記の出品にも一致させる）
  brandReading?: string;
}

const KIDS = /キッズ|kids|ユース|youth|ジュニア|junior|smalls|チルドレン|子供/i;
// モデル名の直前に来てもよい英単語（性別・対象・一般語）。ブランド名と同ブランドの他モデル名の単語も許可する
const COMMON_PREFIX_WORDS = new Set([
  "mens", "men", "womens", "women", "wmns", "ladies", "unisex", "kids", "youth", "junior", "girls", "boys",
  "the", "new", "snowboard", "snowboards", "board", "model",
]);
const SEPARATOR = "[\\s\\-_.・/]*";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// モデル名のすべての出現箇所で、直前に無関係な英単語が付いているか（例: "PRETTY Good Company"）
function hasForeignPrefixWord(itemName: string, target: MatchTarget): boolean {
  const text = itemName.normalize("NFKC").toLowerCase();
  const words = target.model.normalize("NFKC").toLowerCase().split(/[\s.\-_・/]+/).filter(Boolean);
  if (words.length === 0) return false;
  const allowed = new Set([
    ...COMMON_PREFIX_WORDS,
    ...`${target.brand} ${target.siblingModels.join(" ")}`.normalize("NFKC").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
  ]);
  const pattern = new RegExp(words.map(escapeRegExp).join(SEPARATOR), "g");
  let match: RegExpExecArray | null;
  let occurrences = 0;
  while ((match = pattern.exec(text))) {
    occurrences++;
    const before = text.slice(0, match.index).replace(/[\s\-_.・/]+$/, "");
    const prev = before.match(/([a-z][a-z']*)$/)?.[1]?.replace(/'s$/, "");
    // 直前が英単語でない（日本語・数字・記号・文頭）か、許可された単語なら、このモデルの表記とみなす
    if (!prev || allowed.has(prev)) return false;
  }
  return occurrences > 0;
}

// モデル名の直後に限定版・別バリエーションを表す語が続くか（例: "DEATH SERIES LTD", "Push Up＋"）
const VARIANT_SUFFIX = "(?:ltd|limited|plus|\\+|×)";
function hasVariantSuffix(itemName: string, target: MatchTarget): boolean {
  const text = itemName.normalize("NFKC").toLowerCase();
  const words = target.model.normalize("NFKC").toLowerCase().split(/[\s.\-_・/]+/).filter(Boolean);
  if (words.length === 0) return false;
  const modelPattern = words.map(escapeRegExp).join(SEPARATOR);
  const any = new RegExp(modelPattern, "g");
  const variant = new RegExp(`^${SEPARATOR}${VARIANT_SUFFIX}`);
  let match: RegExpExecArray | null;
  let occurrences = 0;
  while ((match = any.exec(text))) {
    occurrences++;
    // 1か所でも素のモデル名として書かれていれば、このモデルの出品とみなす
    if (!variant.test(text.slice(match.index + match[0].length))) return false;
  }
  return occurrences > 0;
}

// 出品名にブランド名（英字またはカタカナ読み）が含まれ、子ども用でないか（未登録モデル候補の抽出用）
export function isListingOfBrand(itemName: string, brand: string, brandReading?: string): boolean {
  const name = normalizeName(itemName);
  const hasBrand = name.includes(normalizeName(brand)) || (brandReading ? name.includes(normalizeName(brandReading)) : false);
  return hasBrand && !KIDS.test(itemName);
}

// この出品が対象モデルのものか
export function matchesModel(itemName: string, target: MatchTarget): boolean {
  const name = normalizeName(itemName);
  const brandOk =
    name.includes(normalizeName(target.brand)) ||
    (target.brandReading ? name.includes(normalizeName(target.brandReading)) : false);
  if (!brandOk) return false;
  const model = normalizeName(target.model);
  if (!model || !name.includes(model)) return false;
  // より長い別モデル名が含まれていれば、そちらの出品とみなす
  const longer = target.siblingModels
    .map(normalizeName)
    .filter((m) => m.length > model.length && m.includes(model));
  if (longer.some((m) => name.includes(m))) return false;
  // 別モデルの「続きの単語」が直後に付いていれば、そちらの出品とみなす
  // （例: ZERO に対して "ZERO WIDE SIPN" のような誤字・省略表記の ZERO WIDE SPIN を除外）
  const modelWords = target.model.normalize("NFKC").split(/\s+/).filter(Boolean);
  for (const sibling of target.siblingModels) {
    const words = sibling.normalize("NFKC").split(/\s+/).filter(Boolean);
    if (words.length <= modelWords.length) continue;
    const samePrefix = modelWords.every((w, i) => normalizeName(w) === normalizeName(words[i]));
    if (samePrefix && name.includes(model + normalizeName(words[modelWords.length]))) return false;
  }
  // 子ども用（モデル名自体が子ども用でなければ除外）
  if (KIDS.test(itemName) && !KIDS.test(target.model)) return false;
  // 複数モデルをまとめた出品（同ブランドの無関係な別モデル名も含む）は価格がどのモデルか分からないため除外
  const unrelated = target.siblingModels
    .map(normalizeName)
    .filter((m) => m && m !== model && !m.includes(model) && !model.includes(m));
  if (unrelated.some((m) => name.includes(m))) return false;
  // "PRETTY Good Company" のように、別の英単語が前に付いた別モデル
  if (hasForeignPrefixWord(itemName, target)) return false;
  // "DEATH SERIES LTD" "Push Up＋" のような限定版・別バリエーション
  if (hasVariantSuffix(itemName, target)) return false;
  return true;
}

// 検索結果から、指定年式の出品の最安値を選ぶ（極端に安い・高い出品は除外）
export function selectOffer(items: RakutenItem[], target: MatchTarget, year: number): MatchedOffer | null {
  const candidates = items.filter(
    (item) =>
      item.availability !== 0 &&
      item.itemPrice > 0 &&
      isBoardListing(item.itemName) &&
      matchesModel(item.itemName, target) &&
      detectModelYear(item.itemName) === year &&
      item.itemPrice >= target.referencePrice * 0.35 &&
      item.itemPrice <= target.referencePrice * 1.4
  );
  if (candidates.length === 0) return null;

  // 中央値の半分未満は誤一致（部品・型違い）の可能性が高いので除外
  const sorted = [...candidates].sort((a, b) => a.itemPrice - b.itemPrice);
  const median = sorted[Math.floor(sorted.length / 2)].itemPrice;
  const best = sorted.find((item) => item.itemPrice >= median * 0.5) ?? sorted[0];

  return {
    price: best.itemPrice,
    url: best.affiliateUrl || best.itemUrl,
    imageUrl: firstImage(best),
    itemName: best.itemName,
    shopName: best.shopName,
    year,
    matchedCount: candidates.length,
  };
}

// 検索キーワードを作る。楽天の検索は1文字の単語（例: "X FLY" の "X"）を含むとエラーになるため除き、
// 長さの上限（半角128文字相当。全角は2文字分として数える）に収める
export function buildSearchKeyword(brand: string, model: string, suffix = "スノーボード"): string {
  const words = `${brand} ${model}`
    .normalize("NFKC")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const width = (text: string) => [...text].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x7f ? 2 : 1), 0);
  const out: string[] = [];
  for (const word of [...words, suffix]) {
    if (width([...out, word].join(" ")) > 120) break;
    out.push(word);
  }
  return out.join(" ");
}
