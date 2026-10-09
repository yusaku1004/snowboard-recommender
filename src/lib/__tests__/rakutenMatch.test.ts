import { describe, expect, it } from "vitest";
import boards from "@/data/boards_data.json";
import {
  buildSearchKeyword,
  isListingOfBrand,
  MatchTarget,
  RakutenItem,
  detectModelYear,
  discoverIgnoreReason,
  isBoardListing,
  matchesModel,
  MODEL_ALIASES,
  modelAliases,
  normalizeName,
  selectOffer,
  upscaleImageUrl,
} from "../rakutenMatch";

const custom: MatchTarget = {
  brand: "BURTON",
  model: "Custom",
  siblingModels: ["Custom", "Custom Flying V", "Custom Camber", "Process"],
  referencePrice: 107800,
  brandReading: "バートン",
};

const item = (itemName: string, itemPrice: number, extra: Partial<RakutenItem> = {}): RakutenItem => ({
  itemName,
  itemPrice,
  itemUrl: `https://item.rakuten.co.jp/shop/${itemPrice}/`,
  affiliateUrl: `https://hb.afl.rakuten.co.jp/${itemPrice}`,
  mediumImageUrls: ["https://thumbnail.image.rakuten.co.jp/a.jpg?_ex=128x128"],
  availability: 1,
  ...extra,
});

describe("detectModelYear", () => {
  it.each([
    ["26-27 BURTON CUSTOM スノーボード", 2027],
    ["2026-2027モデル バートン カスタム", 2027],
    ["【2027年モデル】BURTON Custom", 2027],
    ["25/26 BURTON Custom 板", 2026],
    ["BURTON Custom 2026 スノーボード", 2026],
    ["ＢＵＲＴＯＮ　ＣＵＳＴＯＭ　２６－２７", 2027],
    ["BURTON Custom スノーボード", null],
  ])("%s → %s", (name, year) => {
    expect(detectModelYear(name)).toBe(year);
  });
});

describe("isBoardListing", () => {
  it("ボード本体だけを通し、ビンディング・ブーツ・セット・中古は除外", () => {
    expect(isBoardListing("26-27 BURTON Custom スノーボード 板")).toBe(true);
    expect(isBoardListing("BURTON CARTEL ビンディング 26-27")).toBe(false);
    expect(isBoardListing("BURTON Custom スノーボード 3点セット")).toBe(false);
    expect(isBoardListing("中古 BURTON Custom スノーボード")).toBe(false);
    expect(isBoardListing("BURTON Custom ソールガード")).toBe(false);
    expect(isBoardListing("26-27 バックパック JONES DEEPER 19L リュックサック スノーボード")).toBe(false);
    expect(isBoardListing("日本正規品 スノーボード バッグ BURTON FLIGHT ATTENDANT")).toBe(false);
  });
});

describe("matchesModel", () => {
  it("ブランド名（英字・カナ）とモデル名の両方を含めば一致", () => {
    expect(matchesModel("26-27 BURTON CUSTOM スノーボード", custom)).toBe(true);
    expect(matchesModel("26-27 バートン Custom スノーボード", custom)).toBe(true);
    expect(matchesModel("26-27 CUSTOM スノーボード", custom)).toBe(false);
  });

  it("より長い別モデル名（Custom Flying V）の出品は Custom として扱わない", () => {
    expect(matchesModel("26-27 BURTON CUSTOM FLYING V スノーボード", custom)).toBe(false);
    expect(matchesModel("26-27 BURTON CUSTOM FLYING V スノーボード", { ...custom, model: "Custom Flying V" })).toBe(true);
  });

  it("別モデルの続きの単語が付いた出品は除外する（誤字・省略表記の対策）", () => {
    const zero: MatchTarget = {
      brand: "011 Artistic",
      model: "ZERO",
      siblingModels: ["ZERO", "ZERO WIDE SPIN"],
      referencePrice: 92400,
    };
    expect(matchesModel("25-26 011 artistic snowboard ZERO WIDE SIPN", zero)).toBe(false);
    expect(matchesModel("26-27 011 Artistic ZERO スノーボード", zero)).toBe(true);
  });

  it("子ども用の出品は除外する（モデル名自体が子ども用なら一致）", () => {
    const feelgood: MatchTarget = { brand: "BURTON", model: "Feelgood", siblingModels: ["Feelgood", "Feelgood Camber"], referencePrice: 93500 };
    expect(matchesModel("25-26 BURTON キッズ Kids Feelgood Smalls スノーボード", feelgood)).toBe(false);
    expect(matchesModel("25-26 BURTON Feelgood スノーボード", feelgood)).toBe(true);
    const smalls = { ...feelgood, model: "Feelgood Smalls" };
    expect(matchesModel("25-26 BURTON Kids Feelgood Smalls スノーボード", smalls)).toBe(true);
  });

  it("同ブランドの別モデル名も含む（まとめ売り）出品は除外する", () => {
    const hifi: MatchTarget = {
      brand: "BURTON",
      model: "Family Tree High Fidelity",
      siblingModels: ["Family Tree High Fidelity", "Family Tree Sketch Artist"],
      referencePrice: 115500,
    };
    expect(matchesModel("26-27 BURTON Family Tree Sketch Artist / Family Tree High Fidelity スノーボード", hifi)).toBe(false);
    expect(matchesModel("26-27 BURTON Family Tree High Fidelity スノーボード", hifi)).toBe(true);
  });

  it("別の英単語が前に付いた別モデル（PRETTY Good Company）は除外し、同ブランドの単語（Family Tree）は許可", () => {
    const goodCompany: MatchTarget = { brand: "BURTON", model: "Good Company", siblingModels: ["Good Company", "Custom"], referencePrice: 66000 };
    expect(matchesModel("26-27 BURTON PRETTY GOOD COMPANY CAMBER スノーボード", goodCompany)).toBe(false);
    expect(matchesModel("26-27 BURTON Good Company スノーボード", goodCompany)).toBe(true);
    expect(matchesModel("BURTON バートン スノーボード Men's Good Company 26-27", goodCompany)).toBe(true);
    const alekesam: MatchTarget = { brand: "BURTON", model: "Alekesam", siblingModels: ["Alekesam", "Family Tree Hometown Hero"], referencePrice: 101200 };
    expect(matchesModel("25-26 BURTON スノーボード Family Tree Alekesam キャンバー", alekesam)).toBe(true);
  });

  it("モデル名の直後に LTD・PLUS・＋・× が付く限定版や別バリエーションは除外する", () => {
    const death: MatchTarget = { brand: "DEATH LABEL", model: "DEATH SERIES", siblingModels: ["DEATH SERIES", "DEATH LTD2"], referencePrice: 110000 };
    expect(matchesModel("26-27 DEATH LABEL DEATH SERIES LTD 2×DAYZE スノーボード", death)).toBe(false);
    expect(matchesModel("26-27 DEATH LABEL DEATH SERIES デスシリーズ スノーボード", death)).toBe(true);
    const pushUp: MatchTarget = { brand: "BATALEON", model: "Push Up", siblingModels: ["Push Up"], referencePrice: 80000 };
    expect(matchesModel("25-26 BATALEON Push Up＋ 143cm スノーボード", pushUp)).toBe(false);
    expect(matchesModel("25-26 BATALEON Push Up スノーボード", pushUp)).toBe(true);
    // モデル名自体が LTD を含む場合は、その後ろを見る
    const xflyLtd: MatchTarget = { brand: "011 Artistic", model: "X FLY LTD", siblingModels: ["X FLY", "X FLY LTD"], referencePrice: 118690 };
    expect(matchesModel("26-27 011 ARTISTIC X FLY LTD スノーボード", xflyLtd)).toBe(true);
  });

  it("レディース表記の揺れ（Women's / W'S / WMNS）をそろえる", () => {
    const howler: MatchTarget = { brand: "JONES", model: "Women's Howler", siblingModels: ["Howler", "Women's Howler"], referencePrice: 120000 };
    expect(matchesModel("26-27 JONES ジョーンズ スノーボード W'S HOWLER ハウラー", howler)).toBe(true);
    expect(matchesModel("26-27 JONES WMNS HOWLER スノーボード", howler)).toBe(true);
  });

  it("全角・記号の違いを吸収する", () => {
    expect(normalizeName("Ｔ．Ｒｉｃｅ　Ｐｒｏ")).toBe(normalizeName("T.Rice Pro"));
  });

  it("＋ と Plus、LIMITED と LTD、アクセント記号の違いをそろえる", () => {
    expect(normalizeName("DISASTER+")).toBe(normalizeName("Disaster Plus"));
    expect(normalizeName("EVILTWIN＋")).toBe(normalizeName("Evil Twin Plus"));
    expect(normalizeName("BALANCE LIMITED")).toBe(normalizeName("BALANCE LTD"));
    expect(normalizeName("CAFÉ RACER")).toBe(normalizeName("Cafe Racer"));
    const plus: MatchTarget = { brand: "BATALEON", model: "Disaster Plus", siblingModels: ["Disaster", "Disaster Plus"], referencePrice: 115500 };
    const base: MatchTarget = { ...plus, model: "Disaster", referencePrice: 88000 };
    expect(matchesModel("26-27 BATALEON/バタレオン DISASTER+ ディザスター スノーボード 板", plus)).toBe(true);
    expect(matchesModel("26-27 BATALEON/バタレオン DISASTER+ ディザスター スノーボード 板", base)).toBe(false);
  });

  it("1〜2文字の別モデル名（S・RD）は単語の一部（STREAM・SNOWBOARD）には一致させない", () => {
    const dr: MatchTarget = { brand: "BC STREAM", model: "DR", siblingModels: ["DR", "S", "H", "RIDER'S SPEC"], referencePrice: 129800 };
    expect(matchesModel("26-27 BC STREAM DR ビーシーストリーム スノーボード 板 SNOWBOARDS", dr)).toBe(true);
    // RIDER'S の "S" も別モデル名とみなさない
    const rs: MatchTarget = { ...dr, model: "RIDER'S SPEC" };
    expect(matchesModel("26-27 BC STREAM RIDER'S SPEC スノーボード", rs)).toBe(true);
    // アポストロフィの位置が違う表記（RIDERS' SPEC）も別モデル名として見つける
    const on: MatchTarget = { ...dr, model: "ON", siblingModels: ["ON", "S", "RIDER'S SPEC"] };
    expect(matchesModel("26-27 BC STREAM ビーシーストリーム Riders' Spec ON レディース", on)).toBe(false);
    expect(matchesModel("26-27 BC STREAM ビーシーストリーム ON オン レディース", on)).toBe(true);
    // 単語として書かれた別モデル名は、まとめ売りとして除外する
    expect(matchesModel("26-27 BC STREAM DR / S スノーボード", dr)).toBe(false);
    const lty: MatchTarget = { brand: "SPREAD", model: "LTY", siblingModels: ["LTY", "RD", "LTA"], referencePrice: 96800 };
    expect(matchesModel("26-27 スプレッド スノーボード SPREAD LTY SNOWBOARD", lty)).toBe(true);
  });

  it("ブランド名の詰め書き（NEVERSUMMER）・数字入りの単語（KM4K）・M'S の直後のモデル名は一致させる", () => {
    const valhalla: MatchTarget = { brand: "NEVER SUMMER", model: "Valhalla", siblingModels: ["Valhalla"], referencePrice: 123750 };
    expect(matchesModel("日本正規品 スノーボード 板 ネバーサマー NEVERSUMMER VALHALLA メンズ 26-27", valhalla)).toBe(true);
    const shift: MatchTarget = { brand: "KM4K", model: "PARADICE SHIFT", siblingModels: ["PARADICE SHIFT", "HIKALU"], referencePrice: 69300 };
    expect(matchesModel("日本正規品 スノーボード 板 カモシカ KM4K PARADICE SHIFT 26-27", shift)).toBe(true);
    const flagship: MatchTarget = { brand: "JONES", model: "Flagship", siblingModels: ["Flagship", "Stratos"], referencePrice: 136620 };
    expect(matchesModel("予約 26-27 スノーボード 板 ジョーンズ JONES M'S FLAGSHIP フリーライド", flagship)).toBe(true);
    // モデル名の一部に別の英字が付いたもの（MOSS の Q60 に対する SNOWSTICK の PQ60）は従来どおり除外
    const q60: MatchTarget = { brand: "MOSS", model: "Q60", siblingModels: ["Q60"], referencePrice: 130000 };
    expect(matchesModel("26-27 MOSS SNOWSTICK PQ60 スノーボード", q60)).toBe(false);
  });

  it("登録した別表記（略称・誤字・コラボ名）でも一致し、より長い別表記を持つモデルとは取り違えない", () => {
    const siblings = ["Mega Merc", "Mercury", "Mega Mercury"];
    const megaMerc: MatchTarget = { brand: "CAPITA", model: "Mega Merc", siblingModels: siblings, referencePrice: 154000, aliases: ["Mega Mercury"] };
    const mercury: MatchTarget = { brand: "CAPITA", model: "Mercury", siblingModels: siblings, referencePrice: 99000 };
    expect(matchesModel("26-27 CAPITA/キャピタ MEGA MERCURY メガマーキュリー スノーボード 板", megaMerc)).toBe(true);
    expect(matchesModel("26-27 CAPITA/キャピタ MEGA MERCURY メガマーキュリー スノーボード 板", mercury)).toBe(false);
    expect(matchesModel("26-27 CAPITA/キャピタ MERCURY マーキュリー スノーボード 板", mercury)).toBe(true);
    // コラボ名付きの正式名は、限定版（×）の判定より別表記を優先する
    const stray: MatchTarget = { brand: "DEATH LABEL", model: "STRAY", siblingModels: ["STRAY"], referencePrice: 126500, aliases: ["STRAY×Degarashi"] };
    expect(matchesModel("26-27 DEATH LABEL/デスレーベル STRAY×Degarashi ストレイ スノーボード 板", stray)).toBe(true);
  });
});

describe("MODEL_ALIASES", () => {
  it("すべてのキーが実データのブランド・モデルを指す", () => {
    const keys = new Set((boards as { brand: string; model: string }[]).map((b) => `${b.brand}|${b.model}`));
    expect(Object.keys(MODEL_ALIASES).filter((key) => !keys.has(key))).toEqual([]);
    expect(modelAliases("CAPITA", "Mega Merc")).toEqual(["Mega Mercury"]);
    expect(modelAliases("BURTON", "Custom")).toEqual([]);
  });
});

describe("selectOffer", () => {
  it("指定年式・本体・同モデルの出品から最安値を選ぶ", () => {
    const offer = selectOffer(
      [
        item("26-27 BURTON Custom スノーボード", 99000),
        item("26-27 BURTON Custom スノーボード 板", 95000),
        item("25-26 BURTON Custom スノーボード", 70000), // 年式違い
        item("26-27 BURTON Custom Flying V スノーボード", 90000), // 別モデル
        item("26-27 BURTON Custom 3点セット スノーボード", 80000), // セット
      ],
      custom,
      2027
    );
    expect(offer?.price).toBe(95000);
    expect(offer?.url).toBe("https://hb.afl.rakuten.co.jp/95000");
    expect(offer?.matchedCount).toBe(2);
    expect(offer?.imageUrl).toContain("_ex=400x400");
  });

  it("参考定価から大きく外れた価格・在庫なしは除外し、該当なしなら null", () => {
    expect(
      selectOffer(
        [item("26-27 BURTON Custom スノーボード", 9800), item("26-27 BURTON Custom スノーボード", 99000, { availability: 0 })],
        custom,
        2027
      )
    ).toBeNull();
  });

  it("中央値の半分未満の安すぎる出品は誤一致として除外", () => {
    const offer = selectOffer(
      [
        item("26-27 BURTON Custom スノーボード", 40000),
        item("26-27 BURTON Custom スノーボード", 98000),
        item("26-27 BURTON Custom スノーボード", 100000),
      ],
      custom,
      2027
    );
    expect(offer?.price).toBe(98000);
  });
});

describe("upscaleImageUrl", () => {
  it("既存の _ex 指定を置き換え、無ければ付ける", () => {
    expect(upscaleImageUrl("https://x/a.jpg?_ex=128x128")).toBe("https://x/a.jpg?_ex=400x400");
    expect(upscaleImageUrl("https://x/a.jpg")).toBe("https://x/a.jpg?_ex=400x400");
  });
});

describe("buildSearchKeyword", () => {
  it("1文字の単語は除く（楽天の検索がエラーになるため）", () => {
    expect(buildSearchKeyword("011 Artistic", "X FLY")).toBe("011 Artistic FLY スノーボード");
    expect(buildSearchKeyword("BURTON", "Custom")).toBe("BURTON Custom スノーボード");
  });

  it("長すぎる場合は上限に収める", () => {
    const keyword = buildSearchKeyword("BRAND", "VERY LONG MODEL NAME WITH MANY WORDS ".repeat(5));
    const width = [...keyword].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x7f ? 2 : 1), 0);
    expect(width).toBeLessThanOrEqual(120);
    expect(keyword.startsWith("BRAND VERY")).toBe(true);
  });
});

describe("isListingOfBrand", () => {
  it("ブランド名（英字・カナ）を含み、子ども用でない出品だけ", () => {
    expect(isListingOfBrand("26-27 NITRO ナイトロ ZAZA スノーボード", "NITRO")).toBe(true);
    expect(isListingOfBrand("26-27 ヨネックス YONEX SYMARC ハンマーヘッド", "HEAD")).toBe(false);
    expect(isListingOfBrand("26-27 バートン キッズ スノーボード", "BURTON", "バートン")).toBe(false);
    expect(isListingOfBrand("26-27 バートン スノーボード", "BURTON", "バートン")).toBe(true);
  });

  it("別ブランドの出品（先に別ブランド名がある・より長いブランド名を含む）は除く", () => {
    const brands = ["HEAD", "YONEX", "MOSS", "MOSS SNOWSTICK", "OGASAKA", "RICE28", "NITRO", "SLASH"];
    expect(isListingOfBrand("26-27 ヨネックス YONEX SYMARC ハンマーヘッド スノーボード", "HEAD", "ヘッド", brands)).toBe(false);
    expect(isListingOfBrand("【予約販売中】HEAD ヘッド スノーボード 板 【2026-2027】 ANYTHING LYT", "HEAD", "ヘッド", brands)).toBe(true);
    expect(isListingOfBrand("26-27 MOSS SNOWSTICK/モススノースティック PQ60 スノーボード", "MOSS", "モス", brands)).toBe(false);
    expect(isListingOfBrand("26-27 MOSS SNOWSTICK/モススノースティック PQ60 スノーボード", "MOSS SNOWSTICK", undefined, brands)).toBe(true);
    expect(isListingOfBrand("26-27 RICE28 SNOWBOARD ライス 28 RT6 オガサカ製 スノーボード", "OGASAKA", "オガサカ", brands)).toBe(false);
    expect(isListingOfBrand("26-27 NITRO/ナイトロ SLASH スラッシュ QUIVER スノーボード", "SLASH", undefined, brands)).toBe(false);
  });
});

describe("discoverIgnoreReason", () => {
  it("スプリットボード・アルペンボード・対象外ブランドの出品は理由を返し、それ以外は null", () => {
    expect(discoverIgnoreReason("26-27 UNIT UN SPLIT ユニット スプリットボード 151", "UNIT")).toBe("スプリットボード");
    expect(discoverIgnoreReason("26-27 K2 MARAUDER SPLIT PACKAGE スノーボード", "K2")).toBe("スプリットボード");
    expect(discoverIgnoreReason("26-27 AMICSS ARZ アルペン ALLFLEX対応 スノーボード", "AMICSS")).toBe("アルペンボード");
    expect(discoverIgnoreReason("26-27 FIELD EARTH Q158 フィールド アース スノーボード", "FIELD EARTH")).toMatch(/^FIELD EARTH/);
    expect(discoverIgnoreReason("26-27 GNU S CORP スノーボード", "GNU")).toBeNull();
  });
});
