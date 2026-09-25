"use client";

import { useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        role="presentation"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#0b1328]/95 backdrop-blur-2xl border-t border-white/15 rounded-t-[28px] shadow-[0_-20px_60px_-20px_rgba(56,189,248,0.25)] bottom-sheet-enter max-h-[75vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>
        {/* Title */}
        <h3 className="text-base font-bold text-center text-white px-4 pb-3 shrink-0">
          {title}
        </h3>
        {/* Content */}
        <div className="overflow-y-auto px-4 pb-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
