import { Board, SkillLevel, StyleScores } from "@/types";

export interface ExplainInput {
  height: number;
  weight: number;
  level: SkillLevel;
  // 1〜10 スケール
  style: StyleScores;
  board: Board;
  matchPercentage: number;
  recommendedSize: number;
}

const STYLE_KEYS: (keyof StyleScores)[] = ["ground_tricks", "park", "carving", "run_tricks", "powder"];
const LEVELS: SkillLevel[] = ["beginner", "intermediate", "advanced"];

function isNumberIn(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

// AI解説APIのリクエストを検証する。ボード情報はクライアントの値を信用せず、
// brand / model / year でサーバー側のデータから引き直す（プロンプトへの任意文字列の混入を防ぐ）
export function parseExplainRequest(body: unknown, boards: Board[]): ExplainInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (!isNumberIn(b.height, 140, 200) || !isNumberIn(b.weight, 30, 120)) return null;
  if (!isNumberIn(b.matchPercentage, 0, 100) || !isNumberIn(b.recommendedSize, 100, 200)) return null;
  const level = LEVELS.includes(b.level as SkillLevel) ? (b.level as SkillLevel) : "intermediate";

  const rawStyle = b.style as Record<string, unknown> | undefined;
  if (!rawStyle || !STYLE_KEYS.every((k) => isNumberIn(rawStyle[k], 1, 10))) return null;
  const style = Object.fromEntries(STYLE_KEYS.map((k) => [k, rawStyle[k]])) as unknown as StyleScores;

  const ref = b.board as Record<string, unknown> | undefined;
  if (!ref || typeof ref.brand !== "string" || typeof ref.model !== "string") return null;
  const board = boards.find(
    (x) => x.brand === ref.brand && x.model === ref.model && (ref.year === undefined || x.year === ref.year)
  );
  if (!board) return null;

  return {
    height: b.height,
    weight: b.weight,
    level,
    style,
    board,
    matchPercentage: b.matchPercentage,
    recommendedSize: b.recommendedSize,
  };
}

// 固定ウィンドウ方式の簡易レート制限（サーバーレスではインスタンスごとの目安）
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function isAllowed(key: string, now = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
      }
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  };
}
