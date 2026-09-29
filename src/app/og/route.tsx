import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { decodeFilters, decodeInput } from "@/lib/share";
import { getTopResult } from "@/lib/shareResult";
import { getBoardBySlug } from "@/lib/seo";
import { getStyleSummary, STYLE_KEYS, STYLE_LABELS } from "@/lib/styles";
import { RiderType, getRiderType, getRiderTypeById } from "@/lib/riderTypes";
import { SHAPE_LABELS, getFlexLabel } from "@/lib/glossary";

// OGP画像（1200×630）
//   /og                      サイト全体
//   /og?h=..&w=..（共有URLと同じクエリ）  診断結果（1位のボードとマッチ度）
//   /og?...&format=story     診断結果の Instagram ストーリー用（1080×1920）
//   /og?board=<slug>         ボード個別ページ
//   /og?type=<id>            タイプ紹介ページ
const SIZE = { width: 1200, height: 630 };
const LEVEL_LABELS: Record<string, string> = { beginner: "初心者", intermediate: "中級者", advanced: "上級者" };

// 使う文字だけを含む太字の日本語フォントを Google Fonts から取得（失敗時は既定のフォントで描画）
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@800&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

function Frame({ children, padding = "56px 64px" }: { children: React.ReactNode; padding?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding,
        background: "linear-gradient(135deg, #060b18 0%, #0c1a33 55%, #1a1240 100%)",
        color: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -150,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.35) 0%, transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -150,
          right: -200,
          width: 650,
          height: 650,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 65%)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, color: "#e0f2fe" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #38bdf8, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
          }}
        >
          ／
        </div>
        スノーボード診断
      </div>
      {children}
    </div>
  );
}

function DefaultImage() {
  return (
    <Frame>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
        <div style={{ fontSize: 76, lineHeight: 1.15, letterSpacing: "-0.02em" }}>あなたにぴったりの</div>
        <div style={{ fontSize: 76, lineHeight: 1.15, letterSpacing: "-0.02em", color: "#7dd3fc" }}>一本を見つけよう</div>
        <div style={{ fontSize: 30, color: "#cbd5e1", marginTop: 24 }}>85ブランド・1,000本以上から、合う板とサイズを約1分で診断</div>
      </div>
    </Frame>
  );
}

interface TypeResult {
  type: RiderType;
  brand: string;
  model: string;
  match: number;
  size: number;
  conditions: string;
}

function TypeBadge({ type, size }: { type: RiderType; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(135deg, ${type.colors[0]}, ${type.colors[1]})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.55,
        boxShadow: `0 0 ${size * 0.4}px ${type.colors[0]}88`,
      }}
    >
      {type.emoji}
    </div>
  );
}

// 共有URL（横長）: タイプ名を主役に、相性のいい板を添える
function ResultImage({ type, brand, model, match }: TypeResult) {
  return (
    <Frame>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 30, color: "#cbd5e1" }}>私のスノーボーダータイプは</div>
          <div style={{ fontSize: fitFontSize(type.name, 740, 80), lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 6 }}>{type.name}</div>
          <div style={{ fontSize: 30, color: type.colors[0], marginTop: 10 }}>{type.tagline}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 34, fontSize: 26, color: "#e2e8f0" }}>
            <div style={{ color: "#94a3b8" }}>相性のいい板</div>
            <div>{`${brand} ${model}`}</div>
            <div style={{ padding: "4px 14px", borderRadius: 999, background: "rgba(56,189,248,0.2)", color: "#7dd3fc", fontSize: 22 }}>
              {`${match.toFixed(1)}% MATCH`}
            </div>
          </div>
        </div>
        <TypeBadge type={type} size={260} />
      </div>
      <div style={{ fontSize: 26, color: "#7dd3fc" }}>あなたのタイプも約1分で診断 →</div>
    </Frame>
  );
}

// Instagram ストーリー用（縦長 1080×1920）
function StoryImage({ type, brand, model, match, size, conditions }: TypeResult) {
  return (
    <Frame padding="120px 80px">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", textAlign: "center" }}>
        <TypeBadge type={type} size={300} />
        <div style={{ fontSize: 44, color: "#cbd5e1", marginTop: 70 }}>私のスノーボーダータイプは</div>
        <div style={{ fontSize: fitFontSize(type.name, 900, 110), lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 16 }}>{type.name}</div>
        <div style={{ fontSize: 44, color: type.colors[0], marginTop: 20 }}>{type.tagline}</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 90,
            padding: "40px 56px",
            borderRadius: 48,
            background: "rgba(255,255,255,0.07)",
            border: "2px solid rgba(255,255,255,0.15)",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 34, color: "#94a3b8" }}>相性のいい板</div>
          <div style={{ fontSize: 40, color: "#cbd5e1", marginTop: 16 }}>{brand}</div>
          <div style={{ fontSize: model.length > 16 ? 60 : 76, lineHeight: 1.1 }}>{model}</div>
          <div style={{ fontSize: 38, color: "#7dd3fc", marginTop: 20 }}>{`${match.toFixed(1)}% MATCH ・ ${size}cm`}</div>
          <div style={{ fontSize: 30, color: "#94a3b8", marginTop: 16 }}>{conditions}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", fontSize: 38, color: "#7dd3fc" }}>あなたのタイプは？「スノーボード診断」で検索</div>
    </Frame>
  );
}

// タイプ紹介ページ
function TypeImage({ type }: { type: RiderType }) {
  return (
    <Frame>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 30, color: "#cbd5e1" }}>スノーボーダータイプ</div>
          <div style={{ fontSize: fitFontSize(type.name, 740, 84), lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 6 }}>{type.name}</div>
          <div style={{ fontSize: 32, color: type.colors[0], marginTop: 12 }}>{type.tagline}</div>
        </div>
        <TypeBadge type={type} size={260} />
      </div>
      <div style={{ fontSize: 26, color: "#94a3b8" }}>特徴と相性のいいボードをチェック</div>
    </Frame>
  );
}

function BoardImage({ brand, model, specs, strengths }: { brand: string; model: string; specs: string; strengths: string }) {
  return (
    <Frame>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
        <div style={{ fontSize: 36, color: "#cbd5e1" }}>{brand}</div>
        <div style={{ fontSize: model.length > 18 ? 64 : 84, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{model}</div>
        <div style={{ fontSize: 30, color: "#e2e8f0", marginTop: 24 }}>{specs}</div>
        {strengths && <div style={{ fontSize: 30, color: "#7dd3fc", marginTop: 12 }}>{strengths}</div>}
      </div>
      <div style={{ fontSize: 26, color: "#94a3b8" }}>サイズ・特徴・価格をチェック</div>
    </Frame>
  );
}

const STORY_SIZE = { width: 1080, height: 1920 };

// 全角文字が1行に収まるフォントサイズ（上限 max）
function fitFontSize(text: string, width: number, max: number): number {
  return Math.min(max, Math.floor(width / Math.max(text.length, 1)));
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  let element: React.ReactElement = <DefaultImage />;
  let size = SIZE;
  let text = "スノーボード診断あなたにぴったりの一本を見つけよう85ブランド・1,000本以上から、合う板とサイズを約1分で診断／";

  const boardSlug = search.get("board");
  const typeId = search.get("type");
  const input = boardSlug || typeId ? null : decodeInput(search.toString());

  if (boardSlug) {
    const board = getBoardBySlug(boardSlug);
    if (board) {
      const specs = `${SHAPE_LABELS[board.shape] ?? board.shape} ・ 硬さ ${getFlexLabel(board.flex)}（${board.flex}/10） ・ ${board.year}年モデル`;
      const strong = STYLE_KEYS.filter((k) => board.style_scores[k] >= 8).map((k) => STYLE_LABELS[k]);
      const strengths = strong.length ? `${strong.join("・")}が得意` : "";
      element = <BoardImage brand={board.brand} model={board.model} specs={specs} strengths={strengths} />;
      text = `スノーボード診断／${board.brand}${board.model}${specs}${strengths}サイズ・特徴・価格をチェック`;
    }
  } else if (typeId) {
    const type = getRiderTypeById(typeId);
    if (type) {
      element = <TypeImage type={type} />;
      text = `スノーボード診断／スノーボーダータイプ${type.name}${type.tagline}特徴と相性のいいボードをチェック`;
    }
  } else if (input) {
    const top = getTopResult(input, decodeFilters(search.toString()));
    if (top) {
      const type = getRiderType(input.style, input.level);
      const props: TypeResult = {
        type,
        brand: top.board.brand,
        model: top.board.model,
        match: top.matchPercentage,
        size: top.recommendedSize,
        conditions: `${input.height}cm・${input.weight}kg・${LEVEL_LABELS[input.level]}・${getStyleSummary(input.style)}`,
      };
      const story = search.get("format") === "story";
      element = story ? <StoryImage {...props} /> : <ResultImage {...props} />;
      if (story) size = STORY_SIZE;
      text = `スノーボード診断／私のスノーボーダータイプは${type.name}${type.tagline}相性のいい板${props.brand}${props.model}${props.conditions}%MATCH・cm0123456789.あなたのタイプも約1分で診断→は？「」で検索`;
    }
  }

  const font = await loadFont(text);
  return new ImageResponse(element, {
    ...size,
    emoji: "twemoji",
    ...(font ? { fonts: [{ name: "Noto Sans JP", data: font, weight: 800 as const, style: "normal" as const }] } : {}),
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
  });
}
