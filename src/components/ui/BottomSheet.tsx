"use client";

import { useEffect } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  // Prevent body scroll when open
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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800 rounded-t-2xl bottom-sheet-enter max-h-[70vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>
        {/* Title */}
        <h3 className="text-lg font-bold text-center text-slate-100 px-4 pb-3 shrink-0">
          {title}
        </h3>
        {/* Content */}
        <div className="overflow-y-auto px-4 pb-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
