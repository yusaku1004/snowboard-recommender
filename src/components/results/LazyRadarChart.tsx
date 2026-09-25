"use client";

import dynamic from "next/dynamic";

// Recharts は大きいので、チャートを表示するときだけ読み込む（初期表示を軽くする）
export const RadarChart = dynamic(() => import("./RadarChart").then((m) => m.RadarChart), {
  ssr: false,
  loading: () => <div className="h-[200px]" aria-hidden="true" />,
});
