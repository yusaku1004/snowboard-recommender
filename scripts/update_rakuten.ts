// 楽天市場の商品検索APIから、各ボードの実売価格・画像を取得し、新年式の出品があるモデルを自動で追加する。
//
//   node scripts/update_rakuten.ts                 全ボードを更新（約20分）
//   node scripts/update_rakuten.ts --limit 20      先頭20モデルだけ（動作確認用）
//   node scripts/update_rakuten.ts --brand BURTON  指定ブランドだけ
//   node scripts/update_rakuten.ts --discover      未登録モデルの候補レポートも作る
//   node scripts/update_rakuten.ts --dry-run       ファイルを書き換えない
//   node scripts/update_rakuten.ts --verbose       一致した出品名・価格を表示（判定の確認用）
//
// 必要な環境変数（.env.local でも可）: RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY
// 出力: src/data/rakuten_offers.json, src/data/boards_carryover.json, reports/rakuten-update.md

import * as fs from "node:fs";
import * as https from "node:https";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Board, RakutenOffer } from "../src/types/index.ts";
import { boardSlug } from "../src/lib/slug.ts";
import { BRAND_READINGS } from "../src/lib/brandSearch.ts";
import { RAKUTEN_AFF_ID, SITE_URL } from "../src/lib/constants.ts";
import {
  type MatchedOffer,
  type RakutenItem,
  buildSearchKeyword,
  detectModelYear,
  discoverIgnoreReason,
  isListingOfBrand,
  isBoardListing,
  matchesModel,
  modelAliases,
  selectOffer,
} from "../src/lib/rakutenMatch.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "src/data");
const API_URL = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";
const REQUEST_INTERVAL_MS = 1100;

// ---- 設定 ----
function loadEnvFile() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile();

const args = process.argv.slice(2);
const argValue = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const LIMIT = argValue("--limit") ? Number(argValue("--limit")) : Infinity;
const BRAND_FILTER = argValue("--brand");
const DISCOVER = args.includes("--discover");
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");

const APP_ID = process.env.RAKUTEN_APP_ID;
const ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY;
const AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || RAKUTEN_AFF_ID;
// 楽天のアプリを「Webアプリケーション」で登録し、「許可されたWebサイト」にこのドメインを登録しておく。
// サーバーから呼び出すときも Origin / Referer にこのURLを付ける必要がある。
const ALLOWED_ORIGIN = (process.env.RAKUTEN_ALLOWED_ORIGIN || SITE_URL).replace(/\/$/, "");
if (!APP_ID || !ACCESS_KEY) {
  console.error("RAKUTEN_APP_ID と RAKUTEN_ACCESS_KEY を環境変数（または .env.local）に設定してください。");
  process.exit(1);
}

// 9月以降は翌年のモデルが新作（例: 2026年10月 → 2027年モデル）
const now = new Date();
const NEW_MODEL_YEAR = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear();
const TODAY = now.toISOString().slice(0, 10);

// ---- API ----
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;

// Node の fetch は Origin / Referer を確実に送らないため、https モジュールで明示的に付ける
function getJson(url: string): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Origin: ALLOWED_ORIGIN,
          Referer: `${ALLOWED_ORIGIN}/`,
          "User-Agent": "snowboard-recommender/1.0 (+" + ALLOWED_ORIGIN + ")",
          Accept: "application/json",
        },
        timeout: 30000,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let body: Record<string, unknown> = {};
          try {
            body = JSON.parse(data);
          } catch {
            body = { error: "invalid_json", error_description: data.slice(0, 200) };
          }
          resolve({ status: res.statusCode ?? 0, body });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("タイムアウト")));
    req.on("error", reject);
  });
}

async function searchItems(keyword: string): Promise<RakutenItem[]> {
  const params = new URLSearchParams({
    applicationId: APP_ID!,
    accessKey: ACCESS_KEY!,
    affiliateId: AFFILIATE_ID,
    keyword,
    NGKeyword: "中古 ビンディング ブーツ",
    hits: "30",
    availability: "1",
    imageFlag: "1",
    formatVersion: "2",
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = lastRequest + REQUEST_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    let res: Awaited<ReturnType<typeof getJson>>;
    try {
      res = await getJson(`${API_URL}?${params}`);
    } catch (e) {
      // 通信エラー・タイムアウトは少し待って再試行
      if (attempt === 3) throw e;
      await sleep(3000 * (attempt + 1));
      continue;
    }
    const body = res.body as { error?: string; error_description?: string; Items?: unknown[]; items?: unknown[] };
    if (res.status === 429) {
      await sleep(5000 * (attempt + 1));
      continue;
    }
    if (res.status === 404 || body.error === "not_found") return [];
    if (res.status < 200 || res.status >= 300) {
      const detail = body.error_description || body.error || String(res.status);
      // キーワード起因の 400 はそのモデルだけ飛ばす（全体は止めない）
      if (res.status === 400 && /keyword/i.test(detail)) throw new Error(`キーワードが無効: ${keyword}`);
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        console.error(
          `認証・リクエストエラー（${res.status}）: ${detail}\n` +
            `アプリID・アクセスキー、アプリの種類（Webアプリケーション）と「許可されたWebサイト」（${new URL(ALLOWED_ORIGIN).host}）を確認してください。`
        );
        process.exit(1);
      }
      throw new Error(`楽天API エラー ${res.status}: ${detail}`);
    }
    const items = (body.Items ?? body.items ?? []) as ({ Item?: RakutenItem; item?: RakutenItem } & RakutenItem)[];
    // formatVersion=1 の入れ子形式にも対応
    return items.map((x) => x.Item ?? x.item ?? x);
  }
  throw new Error("楽天API: リクエスト回数の上限に達しました");
}

// ---- データ ----
const readJson = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf-8"));
const baseBoards = readJson<Board[]>("boards_data.json");
const existingCarryover = readJson<Board[]>("boards_carryover.json");

// スラッグごとの最新年式（手作業データ）
const latestBySlug = new Map<string, Board>();
for (const board of baseBoards) {
  const slug = boardSlug(board);
  const prev = latestBySlug.get(slug);
  if (!prev || board.year > prev.year) latestBySlug.set(slug, board);
}
const yearsBySlug = new Map<string, Set<number>>();
for (const board of [...baseBoards, ...existingCarryover]) {
  const slug = boardSlug(board);
  yearsBySlug.set(slug, (yearsBySlug.get(slug) ?? new Set()).add(board.year));
}
const modelsByBrand = new Map<string, string[]>();
for (const board of latestBySlug.values()) {
  modelsByBrand.set(board.brand, [...(modelsByBrand.get(board.brand) ?? []), board.model]);
}
// 別モデルとの取り違えの判定には、別表記（"Mega Mercury" など）も同ブランドのモデル名として含める
const siblingsOf = (brand: string) => {
  const models = modelsByBrand.get(brand) ?? [];
  return [...models, ...models.flatMap((model) => modelAliases(brand, model))];
};
const ALL_BRANDS = [...modelsByBrand.keys()];

const toOffer = (m: MatchedOffer): RakutenOffer => ({
  price: m.price,
  url: m.url,
  ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}),
  fetchedAt: TODAY,
});

// ---- メイン ----
async function main() {
  const targets = [...latestBySlug.entries()]
    .filter(([, b]) => !BRAND_FILTER || b.brand === BRAND_FILTER)
    .slice(0, LIMIT);

  const offers: Record<string, RakutenOffer> = {};
  const carryover = new Map(existingCarryover.map((b) => [`${boardSlug(b)}|${b.year}`, b]));
  let matchedCurrent = 0;
  let matchedNew = 0;
  const newCarryover: string[] = [];

  console.log(`対象 ${targets.length} モデル / 新年式 ${NEW_MODEL_YEAR}`);
  for (const [i, [slug, board]] of targets.entries()) {
    const aliases = modelAliases(board.brand, board.model);
    const target = {
      brand: board.brand,
      model: board.model,
      siblingModels: siblingsOf(board.brand),
      referencePrice: board.price,
      brandReading: BRAND_READINGS[board.brand],
      aliases,
    };
    let items: RakutenItem[] = [];
    try {
      items = await searchItems(buildSearchKeyword(board.brand, board.model));
      // 別表記の出品はモデル名の検索では見つからないことがあるため、別表記でも検索して合わせる
      for (const alias of aliases) {
        const seen = new Set(items.map((item) => item.itemUrl));
        items.push(...(await searchItems(buildSearchKeyword(board.brand, alias))).filter((item) => !seen.has(item.itemUrl)));
      }
    } catch (e) {
      console.warn(`  ! ${board.brand} ${board.model}: ${(e as Error).message}`);
      continue;
    }

    if (VERBOSE) console.log(`\n■ ${board.brand} ${board.model}（定価 ¥${board.price.toLocaleString()}）検索結果 ${items.length}件`);
    for (const year of yearsBySlug.get(slug) ?? [board.year]) {
      const offer = selectOffer(items, target, year);
      if (VERBOSE) console.log(`  ${year}: ${offer ? `¥${offer.price.toLocaleString()}（一致${offer.matchedCount}件）${offer.itemName.slice(0, 70)}` : "なし"}`);
      if (offer) {
        offers[`${slug}|${year}`] = toOffer(offer);
        if (year === board.year) matchedCurrent++;
      }
    }

    // 新年式の出品があり、データに未登録なら前年仕様を引き継いで追加
    if (board.year < NEW_MODEL_YEAR) {
      const offer = selectOffer(items, target, NEW_MODEL_YEAR);
      if (VERBOSE) console.log(`  ${NEW_MODEL_YEAR}: ${offer ? `¥${offer.price.toLocaleString()}（一致${offer.matchedCount}件）${offer.itemName.slice(0, 70)}` : "なし"}`);
      if (offer) {
        matchedNew++;
        const key = `${slug}|${NEW_MODEL_YEAR}`;
        offers[key] = toOffer(offer);
        if (!yearsBySlug.get(slug)?.has(NEW_MODEL_YEAR)) {
          const spec: Board = { ...board };
          delete spec.offer;
          carryover.set(key, { ...spec, year: NEW_MODEL_YEAR, specs_from_year: board.year });
          newCarryover.push(`${board.brand} ${board.model}`);
        }
      }
    }
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${targets.length}`);
  }

  // 未登録モデルの候補（ブランドごとに新年式の出品を検索し、既知モデルに一致しないものを集める）
  const candidates = new Set<string>();
  const ignored = new Map<string, Set<string>>(); // 理由 → 出品名
  if (DISCOVER) {
    const brands = [...modelsByBrand.keys()].filter((b) => !BRAND_FILTER || b === BRAND_FILTER);
    for (const brand of brands) {
      let items: RakutenItem[] = [];
      try {
        items = await searchItems(buildSearchKeyword(brand, String(NEW_MODEL_YEAR)));
      } catch {
        continue;
      }
      const models = modelsByBrand.get(brand) ?? [];
      const siblings = siblingsOf(brand);
      for (const item of items) {
        if (!isBoardListing(item.itemName) || detectModelYear(item.itemName) !== NEW_MODEL_YEAR) continue;
        if (!isListingOfBrand(item.itemName, brand, BRAND_READINGS[brand], ALL_BRANDS)) continue;
        const known = models.some((model) =>
          matchesModel(item.itemName, {
            brand,
            model,
            siblingModels: siblings,
            referencePrice: 0,
            brandReading: BRAND_READINGS[brand],
            aliases: modelAliases(brand, model),
          })
        );
        if (known) continue;
        const reason = discoverIgnoreReason(item.itemName, brand);
        if (reason) ignored.set(reason, (ignored.get(reason) ?? new Set()).add(item.itemName));
        else candidates.add(`| ${brand} | ${item.itemName.replace(/\|/g, "／").slice(0, 90)} | ¥${item.itemPrice.toLocaleString()} |`);
      }
    }
  }

  const summary = [
    `# 楽天データ更新レポート（${TODAY}）`,
    "",
    `- 対象モデル: ${targets.length}`,
    `- 現行年式の実売価格を取得: ${matchedCurrent}（${Math.round((matchedCurrent / Math.max(targets.length, 1)) * 100)}%）`,
    `- ${NEW_MODEL_YEAR}年モデルの出品を検出: ${matchedNew}`,
    `- ${NEW_MODEL_YEAR}年モデルを新たに自動追加（前年仕様を引き継ぎ）: ${newCarryover.length}`,
    "",
    ...(newCarryover.length ? ["## 今回自動追加したモデル", "", ...newCarryover.map((n) => `- ${n}`), ""] : []),
    ...(DISCOVER
      ? [
          `## 未登録の${NEW_MODEL_YEAR}年モデル候補（${candidates.size}件）`,
          "",
          "既存データに一致しなかった出品です。新作であれば CSV に追記して `node scripts/import_csv.ts` で取り込んでください。",
          "",
          "| ブランド | 出品名 | 価格 |",
          "|---|---|---|",
          ...candidates,
          "",
          ...(ignored.size
            ? [
                "対象外として候補から除いた出品（`src/lib/rakutenMatch.ts` の `DISCOVER_IGNORE`）:",
                "",
                ...[...ignored].map(([reason, names]) => `- ${reason}: ${names.size}件`),
                "",
              ]
            : []),
        ]
      : []),
  ].join("\n");
  console.log("\n" + summary);

  if (DRY_RUN) {
    console.log("\n--dry-run のためファイルは更新していません");
    return;
  }
  // 一部だけ更新した場合（--limit / --brand）は、既存の取得結果を残してマージする
  const partial = Number.isFinite(LIMIT) || Boolean(BRAND_FILTER);
  const previous = readJson<{ offers: Record<string, RakutenOffer> }>("rakuten_offers.json").offers;
  const merged = partial ? { ...previous, ...offers } : offers;
  const sortedOffers = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(
    path.join(DATA, "rakuten_offers.json"),
    JSON.stringify({ fetchedAt: TODAY, newModelYear: NEW_MODEL_YEAR, offers: sortedOffers }, null, 2) + "\n"
  );
  const sortedCarryover = [...carryover.values()].sort((a, b) => boardSlug(a).localeCompare(boardSlug(b)));
  fs.writeFileSync(path.join(DATA, "boards_carryover.json"), JSON.stringify(sortedCarryover, null, 2) + "\n");
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports/rakuten-update.md"), summary + "\n");
  console.log("\n更新しました: src/data/rakuten_offers.json, src/data/boards_carryover.json, reports/rakuten-update.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
