// 楽天市場の検索結果から「このボードの出品」を見分けて、価格・画像を選ぶ。
// scripts/update_rakuten.ts から Node で直接読み込むため、型以外の import をしないこと。

export interface RakutenItem {
  itemName: string;
  itemCaption?: string;
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

// 全角→半角、小文字化し、アクセント記号（CAFÉ → cafe）を外す
function toPlainLower(text: string): string {
  return text.normalize("NFKC").normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC").toLowerCase();
}

// 全角→半角、小文字化、空白・記号を除去して比較しやすくする
export function normalizeName(text: string): string {
  return toPlainLower(text)
    // レディース表記の揺れ（Women's / Womens / W's / WMNS）をそろえる
    .replace(/\b(?:women'?s|wmns|w's)(?=[\s.\-_]|$)/g, "w")
    // "DISASTER+" と "Disaster Plus"、"LIMITED" と "LTD" を同じ表記にする
    .replace(/\+/g, "plus")
    .replace(/limited/g, "ltd")
    .replace(/[\s\-_.・'’"“”/\\()（）［］\[\]【】「」『』:：,，、。!！?？&＆#＃*＊~〜]/g, "");
}

// 出品名の中に、モデル名が単語として（前後が英数字でない位置に）含まれるか。
// "S" が "STREAM" に、"RD" が "SNOWBOARD" に一致するような取り違えを防ぐ。
// アポストロフィの位置の違い（RIDER'S / RIDERS'）は無視する。
function containsAsWords(itemName: string, model: string): boolean {
  const plain = (text: string) => toPlainLower(text).replace(/['’]/g, "");
  const words = plain(model).split(/[\s.\-_・/]+/).filter(Boolean);
  if (words.length === 0) return false;
  return new RegExp(`(?<![a-z0-9])${words.map(escapeRegExp).join(SEPARATOR)}(?![a-z0-9])`).test(plain(itemName));
}

// ボード本体以外（ビンディング・ブーツ・小物・中古・セット販売）の出品を除外する
const EXCLUDE = /ビンディング|バインディング|binding|ブーツ|boots?\b|ケース|カバー|ワックス|wax|中古|used|アウトレット品|ソールガード|デッキパッド|ステッカー|リーシュ|セット|3点|２点|2点|三点|ジュニア用ビン|ウェア|ジャケット|パンツ|グローブ|ゴーグル|ヘルメット|バッグ|バックパック|リュック|ザック|ヘアバンド|ヘッドバンド|ニット帽|ビーニー/i;
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
  // 楽天の出品で使われる別の表記（MODEL_ALIASES から渡す）
  aliases?: string[];
}

// 出品名でのモデルの別表記（略称・ショップ側の誤字・コラボ名付きの正式名）。キーは "ブランド|モデル"。
// 正規化（大文字小文字・空白・記号・LIMITED/LTD・+/Plus の違い）で吸収できない表記だけを登録する。
// 別表記で一致したときは、限定版（LTD・×）や前置きの英単語の判定を行わない。
export const MODEL_ALIASES: Record<string, string[]> = {
  "CAPITA|Mega Merc": ["Mega Mercury"],
  "CAPITA|Spring Break Powder Twin": ["SB Powder Twin"],
  "CAPITA|Spring Break Stairmaster": ["SB Stairmaster"],
  "CROOJA|HORNET": ["HONET"],
  "DEATH LABEL|THE COFFIN": ["THE COFFFN"],
  "DEATH LABEL|THE DRIFTER": ["THE DRIFTER×KENGO KIMURA"],
  "DEATH LABEL|KINTONE": ["KINTONE×328"],
  "DEATH LABEL|PJ GUSTAFSSON": ["PJ GUSTAFSSON×Kris Markovich"],
  "DEATH LABEL|STRAY": ["STRAY×Degarashi"],
  "FANATIC|TRICKMASTAR": ["TRICKMASTER"],
  // "+" 表記の出品は "Plus" で検索しても見つからないため、検索用に登録する
  "BATALEON|Disaster Plus": ["Disaster+"],
  "BATALEON|Evil Twin Plus": ["EvilTwin+"],
  "BATALEON|Goliath Plus": ["Goliath+"],
  "BATALEON|Tornado Beyond Medals": ["Tornado"],
  "KM4K|PARADICE STICK 6": ["PARADICE STICK"],
  "MOSS SNOWSTICK|LITTLE FLUFFY": ["LITTELE FLUFFY"],
  "MOSS SNOWSTICK|LL66": ["LL 166"],
  "NEVER SUMMER|Instigator": ["INSTAGATOR"],
  "NIDECKER|SOREL Surfer": ["SOREL"],
  "NITRO|Basher Quiver": ["Basher"],
  "NITRO|Cannon Quiver": ["Cannon"],
  "NITRO|Dinghy Quiver": ["Dinghy"],
  "PUBLIC|General Public": ["GENERAL"],
  "PUBLIC|General Public Select": ["GENERAL SELECT"],
  "PUBLIC|Guest Pro Ben Kadow": ["GENERAL BEN KADOW"],
  "RIDE|Moderator": ["MODERATER"],
  "SABRINA|KUROMI": ["KUROMI LIMITED"],
  "SIMS|BOWL SQUAD": ["BAWL SQUAD"],
  "ThirtyTwo|Volcom Creedler": ["Volcom Creeder"],
};

// 未登録モデル候補のレポートに出さない出品（サイトで扱わない種類・追加しないと決めたブランド）。
// brand を省略すると全ブランドが対象。該当した件数は理由ごとにレポートに出す。
export const DISCOVER_IGNORE: { brand?: string; pattern: RegExp; reason: string }[] = [
  { pattern: /スプリット|split/i, reason: "スプリットボード" },
  { pattern: /アルペン|alpine|alpen/i, reason: "アルペンボード" },
  { brand: "FIELD EARTH", pattern: /./, reason: "FIELD EARTH（バックカントリー向け。サイズごとにモデル名が分かれ、仕様が取れない）" },
];

// 未登録モデル候補から除く理由（除かない場合は null）
export function discoverIgnoreReason(itemName: string, brand: string): string | null {
  const rule = DISCOVER_IGNORE.find((r) => (!r.brand || r.brand === brand) && r.pattern.test(itemName.normalize("NFKC")));
  return rule ? rule.reason : null;
}

export function modelAliases(brand: string, model: string): string[] {
  return MODEL_ALIASES[`${brand}|${model}`] ?? [];
}

const KIDS = /キッズ|kids|ユース|youth|ジュニア|junior|smalls|チルドレン|子供/i;
// モデル名の直前に来てもよい英単語（性別・対象・一般語）。ブランド名と同ブランドの他モデル名の単語も許可する
const COMMON_PREFIX_WORDS = new Set([
  "mens", "men", "womens", "women", "wmns", "ladies", "unisex", "kids", "youth", "junior", "girls", "boys",
  "the", "new", "snowboard", "snowboards", "board", "model", "shapes",
  // "M'S FLAGSHIP" "MS STRATOS" のような性別の略記と、コラボ表記の "x"
  "m", "ms", "w", "ws", "x",
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
    // "NEVERSUMMER" "LIBTECH" のようにブランド名を詰めて書いた表記
    normalizeName(target.brand),
  ]);
  const pattern = new RegExp(words.map(escapeRegExp).join(SEPARATOR), "g");
  let match: RegExpExecArray | null;
  let occurrences = 0;
  while ((match = pattern.exec(text))) {
    occurrences++;
    const before = text.slice(0, match.index).replace(/[\s\-_.・/]+$/, "");
    // 数字を含む単語（"KM4K" "WRXsb"）も1語として見る。数字だけ（"26-27" など）は単語とみなさない
    const prev = before.match(/([a-z0-9']*[a-z][a-z0-9']*)$/)?.[1]?.replace(/'s$/, "");
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
// otherBrands を渡すと、別ブランドの出品（"MOSS SNOWSTICK" を MOSS で、"ヨネックス ... ハンマーヘッド" を HEAD で
// 拾ったもの、"オガサカ製" の別ブランドなど）を除く。別ブランド名が先に出てくるか、このブランド名を含む
// より長いブランド名が出てくれば、別ブランドの出品とみなす。
export function isListingOfBrand(itemName: string, brand: string, brandReading?: string, otherBrands: string[] = []): boolean {
  const name = normalizeName(itemName);
  const hasBrand = name.includes(normalizeName(brand)) || (brandReading ? name.includes(normalizeName(brandReading)) : false);
  if (!hasBrand || KIDS.test(itemName)) return false;
  const text = toPlainLower(itemName);
  const position = (b: string) => {
    const words = toPlainLower(b).split(/[\s.\-_・/]+/).filter(Boolean);
    const m = new RegExp(`(?<![a-z0-9'])${words.map(escapeRegExp).join(SEPARATOR)}(?![a-z0-9])`).exec(text);
    return m ? m.index : -1;
  };
  const own = Math.min(
    ...[position(brand), brandReading ? text.indexOf(toPlainLower(brandReading)) : -1].map((i) => (i < 0 ? Infinity : i))
  );
  return !otherBrands.some((other) => {
    if (normalizeName(other) === normalizeName(brand)) return false;
    const at = position(other);
    if (at < 0) return false;
    return normalizeName(other).includes(normalizeName(brand)) || at < own;
  });
}

// この出品が対象モデルのものか
export function matchesModel(itemName: string, target: MatchTarget): boolean {
  const name = normalizeName(itemName);
  const brandOk =
    name.includes(normalizeName(target.brand)) ||
    (target.brandReading ? name.includes(normalizeName(target.brandReading)) : false);
  if (!brandOk) return false;
  if (matchesModelName(itemName, name, target)) return true;
  // 登録済みの別表記で一致するか（より長い別モデル名を含む出品と子ども用は除く）
  return (target.aliases ?? []).some((alias) => {
    const a = normalizeName(alias);
    if (!a || !name.includes(a)) return false;
    if (KIDS.test(itemName) && !KIDS.test(target.model)) return false;
    return !target.siblingModels.map(normalizeName).some((m) => m.length > a.length && m.includes(a) && name.includes(m));
  });
}

function matchesModelName(itemName: string, name: string, target: MatchTarget): boolean {
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
  // （"S" や "RD" のような短いモデル名が単語の一部に一致しないよう、単語単位で探す）
  const unrelated = target.siblingModels.filter((sibling) => {
    const m = normalizeName(sibling);
    return m && m !== model && !m.includes(model) && !model.includes(m);
  });
  if (unrelated.some((m) => containsAsWords(itemName, m))) return false;
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
