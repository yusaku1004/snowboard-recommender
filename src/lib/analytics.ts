import { track } from "@vercel/analytics";

// Vercel Web Analytics のカスタムイベント。
// ページビューは全プランで計測されるが、カスタムイベントの集計は Vercel の有料プランが必要。
type AnalyticsEvent =
  | "step_view" // ウィザードのステップ表示
  | "result_view" // 診断結果の表示
  | "share" // シェアボタン押下
  | "diagnose_cta"; // 検索用ページから診断への導線クリック

type Props = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: AnalyticsEvent, props?: Props) {
  try {
    track(name, props);
  } catch {
    // 計測の失敗で画面操作を止めない
  }
}
