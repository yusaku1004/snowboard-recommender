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
    "px-6 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer text-sm";
  const variants = {
    primary:
      "btn-shimmer bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-400/35 hover:-translate-y-0.5 active:translate-y-0",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600",
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
