import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "スノーボード診断 - あなたにぴったりの板を見つけよう";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          position: "relative",
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Mountain silhouette */}
        <svg
          width="1200"
          height="120"
          viewBox="0 0 1200 120"
          style={{ position: "absolute", bottom: 0, left: 0 }}
        >
          <path
            d="M0,100 L100,60 L200,80 L300,40 L400,70 L500,30 L600,55 L700,25 L800,50 L900,35 L1000,65 L1100,45 L1200,75 L1200,120 L0,120 Z"
            fill="rgba(30,41,59,0.6)"
          />
        </svg>
        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(to right, #7dd3fc, #ffffff, #7dd3fc)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          スノーボード診断
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            marginBottom: 40,
          }}
        >
          あなたにぴったりの板を見つけよう
        </div>
        {/* Tags */}
        <div style={{ display: "flex", gap: 12 }}>
          {["グラトリ", "パーク", "カービング", "ラントリ", "パウダー"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  fontSize: 18,
                  color: "#38bdf8",
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  padding: "8px 20px",
                  borderRadius: 12,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
