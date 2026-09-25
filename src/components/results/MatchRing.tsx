interface MatchRingProps {
  value: number; // 0-100
  size?: number;
}

// マッチ度を円形ゲージで表示
export function MatchRing({ value, size = 84 }: MatchRingProps) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="match-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#match-ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-fill drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]"
          style={{ ["--ring-circumference" as string]: `${circumference}` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white tabular-nums leading-none">
          {value >= 100 ? 100 : (Math.floor(value * 10) / 10).toFixed(1)}
          <span className="text-xs font-bold text-slate-300">%</span>
        </span>
        <span className="text-[9px] tracking-wider text-slate-400 mt-0.5">MATCH</span>
      </div>
    </div>
  );
}
