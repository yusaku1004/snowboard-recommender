import { describe, expect, it } from "vitest";
import { cleanWaistWidths, extractWaistPairs, waistAt, waistFit, waistsForLengths } from "../waist";

describe("extractWaistPairs", () => {
  it("表形式（【全長/ノーズ幅/ウエスト幅/...】・149cm/289mm/248mm/...）を読む", () => {
    const text = "■スペック■【全長/ノーズ幅/ウエスト幅/テール幅/有効エッジ】・149cm/289mm/248mm/289mm/1130mm ・152cm/292mm/251mm/292mm/1160mm ・155Wcm/298mm/262mm/298mm/1190mm";
    expect(extractWaistPairs(text)).toEqual([[149, 248], [152, 251]]);
  });

  it("項目形式（SIZE / WAIST WIDTH、サイズ(cm) / ウエスト幅(cm)）を読み、cm は mm に直す", () => {
    expect(extractWaistPairs("SIZE:140 WAIST WIDTH:23.8 SIDECUT:6.6 SIZE:143 WAIST WIDTH:24.0 SIDECUT:6.7")).toEqual([[140, 238], [143, 240]]);
    expect(extractWaistPairs("●サイズ(cm):147 有効エッジ(cm):110.0 ウエスト幅(cm):24.8 サイドカット(m):7.5")).toEqual([[147, 248]]);
    expect(extractWaistPairs("LENGTH(cm):139 EFFECTIVE EDGE(mm):1060 WAIST WIDTH(mm):237")).toEqual([[139, 237]]);
  });

  it("括弧形式（150cm( 有効エッジ長/1170mm ウエスト幅/247mm )）を読む", () => {
    expect(extractWaistPairs("■サイズ: 150cm( 有効エッジ長/1170mm ウエスト幅/247mm リコメンド幅/51~59cm )")).toEqual([[150, 247]]);
  });

  it("ウエスト幅としてありえない値や、ワイドのサイズは読まない", () => {
    expect(extractWaistPairs("SIZE:150 WAIST WIDTH:1170")).toEqual([]);
    expect(extractWaistPairs("SIZE:156W WAIST WIDTH:26.4")).toEqual([]);
    expect(extractWaistPairs("ウエスト幅が広めでパウダーでも安定")).toEqual([]);
  });
});

describe("cleanWaistWidths", () => {
  it("サイズ展開にある長さ（±1cm）だけ残し、複数の値は中央値にする", () => {
    const pairs: [number, number][] = [[150, 248], [150, 250], [150, 252], [153, 251], [124, 252], [158, 256]];
    expect(cleanWaistWidths(pairs, [150, 154, 157])).toEqual({ "150": 250, "154": 251, "157": 256 });
  });

  it("短いサイズが次のサイズより明らかに広い値はワイド版の混入として除く", () => {
    const pairs: [number, number][] = [[156, 253], [158, 263], [159, 255]];
    expect(cleanWaistWidths(pairs, [156, 158, 159])).toEqual({ "156": 253, "159": 255 });
  });
});

describe("waistAt / waistFit", () => {
  const widths = { "150": 248, "154": 252, "158": 262 };

  it("指定の長さ、無ければ ±1cm の長さの値を返す", () => {
    expect(waistAt(widths, 154)).toBe(252);
    expect(waistAt(widths, 157)).toBe(262);
    expect(waistAt(widths, 152)).toBeNull();
    expect(waistAt(undefined, 154)).toBeNull();
  });

  it("サイズ展開の長さごとに、値がわかるものだけ返す（年式違いの長さは出さない）", () => {
    expect(waistsForLengths(widths, [150, 153, 156])).toEqual([[150, 248], [153, 252]]);
    expect(waistsForLengths(undefined, [150])).toEqual([]);
  });

  it("ブーツ27〜27.5cmは255mm、28cm以上は260mmを目安に判定し、未入力・小さめは判定しない", () => {
    expect(waistFit(255, "medium")).toBe("ok");
    expect(waistFit(252, "medium")).toBe("narrow");
    expect(waistFit(260, "large")).toBe("ok");
    expect(waistFit(258, "large")).toBe("narrow");
    expect(waistFit(240, "small")).toBeNull();
    expect(waistFit(240, undefined)).toBeNull();
    expect(waistFit(null, "large")).toBeNull();
  });
});
