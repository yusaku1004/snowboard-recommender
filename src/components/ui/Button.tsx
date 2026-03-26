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
    "px-6 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer";
  const variants = {
    primary:
      "btn-shimmer bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white shadow-lg shadow-sky-500/30 hover:shadow-sky-400/40",
    secondary:
      "bg-slate-700 hover:bg-slate-600 text-slate-200",
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
