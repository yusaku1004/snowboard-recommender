"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 cursor-pointer text-sm active:scale-[0.98]";
  const variants = {
    primary:
      "btn-shimmer bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 text-white shadow-[0_10px_30px_-8px_rgba(56,189,248,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] hover:shadow-[0_14px_36px_-8px_rgba(56,189,248,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-110",
    secondary:
      "glass text-slate-200 hover:bg-white/10",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
