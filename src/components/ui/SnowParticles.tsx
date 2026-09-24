"use client";

interface Particle {
  id: number;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
}

// サーバーとクライアントで同じ配置になるよう固定シードの乱数を使う (mulberry32)
function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateParticles(): Particle[] {
  const random = seededRandom(20260101);
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(random() * 100).toFixed(2)}%`,
    size: Math.round((2 + random() * 4) * 100) / 100,
    delay: `${(random() * 15).toFixed(2)}s`,
    duration: `${(10 + random() * 15).toFixed(2)}s`,
    opacity: Math.round((0.3 + random() * 0.5) * 100) / 100,
  }));
}

const PARTICLES = generateParticles();

export function SnowParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="snowflake absolute rounded-full bg-white"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: 0,
            animationDelay: p.delay,
            animationDuration: p.duration,
            // @ts-expect-error CSS custom property
            "--snow-opacity": p.opacity,
          }}
        />
      ))}
    </div>
  );
}
