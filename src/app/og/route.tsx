import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { decodeFilters, decodeInput } from "@/lib/share";
import { getTopResult } from "@/lib/shareResult";
import { getBoardBySlug } from "@/lib/seo";
import { getStyleSummary, STYLE_KEYS, STYLE_LABELS } from "@/lib/styles";
import { SHAPE_LABELS, getFlexLabel } from "@/lib/glossary";

// OGP画像（1200×630）
//   /og                      サイト全体
//   /og?h=..&w=..（共有URLと同じクエリ）  診断結果（1位のボードとマッチ度）
//   /og?board=<slug>         ボード個別ページ
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

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 64px",
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

function ResultImage({ brand, model, match, size, conditions }: { brand: string; model: string; match: number; size: number; conditions: string }) {
  return (
    <Frame>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 48, marginTop: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 30, color: "#fbbf24" }}>★ 診断結果のベストマッチ</div>
          <div style={{ fontSize: 36, color: "#cbd5e1", marginTop: 18 }}>{brand}</div>
          <div style={{ fontSize: model.length > 18 ? 60 : 80, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{model}</div>
          <div style={{ fontSize: 30, color: "#e2e8f0", marginTop: 20 }}>{`おすすめサイズ ${size}cm`}</div>
          <div style={{ fontSize: 24, color: "#94a3b8", marginTop: 14 }}>{conditions}</div>
        </div>
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: "18px solid #38bdf8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 60px rgba(56,189,248,0.55)",
          }}
        >
          <div style={{ fontSize: 80, lineHeight: 1 }}>{match.toFixed(1)}</div>
          <div style={{ fontSize: 26, color: "#cbd5e1", marginTop: 6 }}>% MATCH</div>
        </div>
      </div>
      <div style={{ fontSize: 26, color: "#7dd3fc" }}>あなたに合う板も約1分で診断 →</div>
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

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  let element: React.ReactElement = <DefaultImage />;
  let text = "スノーボード診断あなたにぴったりの一本を見つけよう85ブランド・1,000本以上から、合う板とサイズを約1分で診断／";

  const boardSlug = search.get("board");
  const input = boardSlug ? null : decodeInput(search.toString());

  if (boardSlug) {
    const board = getBoardBySlug(boardSlug);
    if (board) {
      const specs = `${SHAPE_LABELS[board.shape] ?? board.shape} ・ 硬さ ${getFlexLabel(board.flex)}（${board.flex}/10） ・ ${board.year}年モデル`;
      const strong = STYLE_KEYS.filter((k) => board.style_scores[k] >= 8).map((k) => STYLE_LABELS[k]);
      const strengths = strong.length ? `${strong.join("・")}が得意` : "";
      element = <BoardImage brand={board.brand} model={board.model} specs={specs} strengths={strengths} />;
      text = `スノーボード診断／${board.brand}${board.model}${specs}${strengths}サイズ・特徴・価格をチェック`;
    }
  } else if (input) {
    const top = getTopResult(input, decodeFilters(search.toString()));
    if (top) {
      const conditions = `${input.height}cm・${input.weight}kg・${LEVEL_LABELS[input.level]}・${getStyleSummary(input.style)}`;
      element = (
        <ResultImage
          brand={top.board.brand}
          model={top.board.model}
          match={top.matchPercentage}
          size={top.recommendedSize}
          conditions={conditions}
        />
      );
      text = `スノーボード診断／★診断結果のベストマッチ${top.board.brand}${top.board.model}おすすめサイズcm${conditions}%MATCH0123456789.あなたに合う板も約1分で診断→`;
    }
  }

  const font = await loadFont(text);
  return new ImageResponse(element, {
    ...SIZE,
    ...(font ? { fonts: [{ name: "Noto Sans JP", data: font, weight: 800 as const, style: "normal" as const }] } : {}),
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
  });
}
