"use client";

import { useState, useEffect } from "react";

interface Particle {
  id: number;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 4,
    delay: `${Math.random() * 15}s`,
    duration: `${10 + Math.random() * 15}s`,
    opacity: 0.3 + Math.random() * 0.5,
  }));
}

export function SnowParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(generateParticles());
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
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
