import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const SHAPE_LABELS: Record<string, string> = {
  camber: "キャンバー",
  rocker: "ロッカー",
  flat: "フラット",
  hybrid_camber: "ハイブリッドキャンバー",
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
- マークダウン記法は使わないでください。`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const data: ExplainRequest = await request.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    });

    const prompt = buildPrompt(data);
    const stream = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text =
              chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch {
          // Stream error — close gracefully
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to generate explanation" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
