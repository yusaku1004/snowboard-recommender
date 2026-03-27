"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StyleScores } from "@/types";

interface RadarChartProps {
  scores: StyleScores;
  compareScores?: StyleScores;
  compareLabel?: string;
}

const LABELS: Record<keyof StyleScores, string> = {
  ground_tricks: "グラトリ",
  park: "パーク",
  carving: "カービング",
  run_tricks: "ラントリ",
  powder: "パウダー",
};

export function RadarChart({ scores, compareScores, compareLabel }: RadarChartProps) {
  const keys = Object.keys(LABELS) as (keyof StyleScores)[];
  const data = keys.map((key) => ({
    subject: LABELS[key],
    value: scores[key],
    ...(compareScores ? { compare: compareScores[key] } : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={compareScores ? 230 : 200}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#475569" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
        />
        <Radar
          name="このボード"
          dataKey="value"
          stroke="#38bdf8"
          fill="#38bdf8"
          fillOpacity={0.3}
        />
        {compareScores && (
          <Radar
            name={compareLabel || "自分の板"}
            dataKey="compare"
            stroke="#f97316"
            fill="#f97316"
            fillOpacity={0.15}
          />
        )}
        {compareScores && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
          />
        )}
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
