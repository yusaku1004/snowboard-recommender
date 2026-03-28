"use client";

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [visible]);

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => { e.stopPropagation(); setVisible((v) => !v); }}
        className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
        aria-label="説明を表示"
      >
        <span className="text-[9px] font-bold leading-none">?</span>
      </button>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 bg-slate-800 border border-slate-600/60 rounded-xl px-3 py-2.5 shadow-xl shadow-black/40 pointer-events-none">
          <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-600/60 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}
