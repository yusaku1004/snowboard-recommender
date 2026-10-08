import { describe, expect, it } from "vitest";
import {
  buildSearchKeyword,
  isListingOfBrand,
  MatchTarget,
  RakutenItem,
  detectModelYear,
  isBoardListing,
  matchesModel,
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
});
