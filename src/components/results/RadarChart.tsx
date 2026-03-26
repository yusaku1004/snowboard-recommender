"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { StyleScores } from "@/types";

interface RadarChartProps {
  scores: StyleScores;
}

const LABELS: Record<keyof StyleScores, string> = {
  ground_tricks: "グラトリ",
  park: "パーク",
  carving: "カービング",
  run_tricks: "ラントリ",
  powder: "パウダー",
};

export function RadarChart({ scores }: RadarChartProps) {
  const data = (Object.keys(LABELS) as (keyof StyleScores)[]).map((key) => ({
    subject: LABELS[key],
    value: scores[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#475569" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <Radar
          dataKey="value"
          stroke="#38bdf8"
          fill="#38bdf8"
          fillOpacity={0.3}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
