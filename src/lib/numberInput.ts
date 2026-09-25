// 入力文字列を数値に変換（全角数字・カンマ・「万」表記に対応）
export function parseNumericInput(text: string): number | null {
  const normalized = text.normalize("NFKC").replace(/[,\s¥円]/g, "");
  const man = normalized.match(/^(\d+(?:\.\d+)?)万$/);
  if (man) return Number(man[1]) * 10000;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

// 範囲内に収め、ステップ単位に丸める
export function snapToStep(value: number, min: number, max: number, step: number): number {
  const snapped = Math.round((value - min) / step) * step + min;
  return Math.min(max, Math.max(min, snapped));
}
