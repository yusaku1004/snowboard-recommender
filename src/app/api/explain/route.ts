import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

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

interface ExplainRequest {
  height: number;
  weight: number;
  style: Record<string, number>;
  board: {
    brand: string;
    model: string;
    flex: number;
    shape: string;
    style_scores: Record<string, number>;
  };
  matchPercentage: number;
  recommendedSize: number;
}

function buildPrompt(data: ExplainRequest): string {
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
- 身長: ${data.height}cm / 体重: ${data.weight}kg
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
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const data: ExplainRequest = await request.json();

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
