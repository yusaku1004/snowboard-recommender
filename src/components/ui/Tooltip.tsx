"use client";

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  // 画面端ではみ出さないよう吹き出しの位置を選ぶ
  align?: "start" | "center" | "end";
}

const POPUP_POSITION = {
  start: { popup: "left-0", arrow: "left-3" },
  center: { popup: "left-1/2 -translate-x-1/2", arrow: "left-1/2 -translate-x-1/2" },
  end: { popup: "right-0", arrow: "right-3" },
};

export function Tooltip({ text, children, align = "center" }: TooltipProps) {
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
        // ホバーはマウスのときだけ（タップでは mouseenter と click が両方発火して即閉じてしまうため）
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setVisible(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setVisible(false); }}
        onClick={(e) => {
          e.stopPropagation();
          // マウスではホバーで既に開いているので閉じない
          if ((e.nativeEvent as PointerEvent).pointerType === "mouse") setVisible(true);
          else setVisible((v) => !v);
        }}
        // 見た目は16pxのまま、タップ領域は24px確保する（負のマージンでレイアウトは変えない）
        className="group flex-shrink-0 w-6 h-6 -m-1 flex items-center justify-center cursor-pointer rounded-full"
        aria-label="説明を表示"
        aria-expanded={visible}
      >
        <span className="w-4 h-4 rounded-full bg-white/15 text-slate-400 group-hover:bg-white/20 group-hover:text-slate-300 transition-colors flex items-center justify-center">
          <span className="text-[9px] font-bold leading-none">?</span>
        </span>
      </button>
      {visible && (
        <div className={`absolute bottom-full ${POPUP_POSITION[align].popup} mb-2 z-50 w-52 bg-[#0f1830]/95 backdrop-blur-xl border border-white/15 rounded-xl px-3 py-2.5 shadow-xl shadow-black/40 pointer-events-none`}>
          <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          <div className={`absolute top-full ${POPUP_POSITION[align].arrow} w-2 h-2 bg-[#0f1830] border-r border-b border-white/15 rotate-45 -mt-1`} />
        </div>
      )}
    </div>
  );
}
