import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import boardsData from "@/data/boards_data.json";
import { Board } from "@/types";
import { createRateLimiter, ExplainInput, parseExplainRequest } from "@/lib/explainRequest";

// 1つのIPから10分間に10回まで（API利用料の乱用対策）
const isAllowed = createRateLimiter(10, 10 * 60 * 1000);

const SHAPE_LABELS: Record<string, string> = {
  camber: "キャンバー",
  rocker: "ロッカー",
  flat: "フラット",
  hybrid_camber: "ハイブリッドキャンバー",
  hybrid_rocker: "ハイブリッドロッカー",
  double_camber: "ダブルキャンバー",
};

const STYLE_LABELS: Record<string, string> = {
  ground_tricks: "グラトリ",
  park: "パーク",
  carving: "カービング",
  run_tricks: "ラントリ",
  powder: "パウダー",
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "初心者",
  intermediate: "中級者",
  advanced: "上級者",
};

function buildPrompt(data: ExplainInput): string {
  const userStyleDesc = Object.entries(data.style)
    .filter(([, v]) => v >= 6)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `${STYLE_LABELS[k] || k}(${v}/10)`)
    .join("、");

  const boardStyleDesc = Object.entries(data.board.style_scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${STYLE_LABELS[k] || k}(${v}/10)`)
    .join("、");

  return `あなたはプロのスノーボードアドバイザーです。
以下の診断結果について、なぜこのボードがこのユーザーに合っているのかを解説してください。

【ユーザー】
- 身長: ${data.height}cm / 体重: ${data.weight}kg / レベル: ${LEVEL_LABELS[data.level]}
- 重視スタイル: ${userStyleDesc || "バランス型"}

【おすすめボード】
- ${data.board.brand} ${data.board.model}
- 形状: ${SHAPE_LABELS[data.board.shape] || data.board.shape} / フレックス: ${data.board.flex}/10
- ボードの得意スタイル: ${boardStyleDesc}
- マッチ度: ${data.matchPercentage}%
- おすすめサイズ: ${data.recommendedSize}cm

【指示】
- 3〜4文で簡潔に、フレンドリーな口調で解説してください。
- ユーザーのスタイルとボードの特性がなぜ合うのか、具体的な理由を述べてください。
- フレックスや形状の特徴にも触れてください。
- サイズの根拠にも軽く触れてください。
- マークダウン記法は使わないでください。
- 挨拶や呼びかけ（「こんにちは」「〇〇さん」など）は不要です。いきなり本題から始めてください。`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI explanation is not available" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!isAllowed(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let data: ExplainInput | null;
  try {
    data = parseExplainRequest(await request.json(), boardsData as Board[]);
  } catch {
    data = null;
  }
  if (!data) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const prompt = buildPrompt(data);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (e) {
    console.error("Gemini API error:", e);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
