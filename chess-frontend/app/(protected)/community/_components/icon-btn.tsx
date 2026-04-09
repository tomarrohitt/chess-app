"use client";

import { useTransition } from "react";

export function IconBtn({
  icon,
  label,
  onClick,
  variant = "default",
  className = "",
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => Promise<boolean>;
  variant?: "default" | "green" | "red" | "amber";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isPending, startTransition] = useTransition();
  const colors = {
    default: {
      bg: "rgba(255,255,255,0.07)",
      hover: "rgba(255,255,255,0.13)",
      color: "#a1a1aa",
    },
    green: {
      bg: "rgba(34,197,94,0.12)",
      hover: "rgba(34,197,94,0.22)",
      color: "#4ade80",
    },
    red: {
      bg: "rgba(239,68,68,0.1)",
      hover: "rgba(239,68,68,0.2)",
      color: "#f87171",
    },
    amber: {
      bg: "rgba(234,179,8,0.1)",
      hover: "rgba(234,179,8,0.2)",
      color: "#fbbf24",
    },
  }[variant];

  return (
    <button
      title={label}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:brightness-125 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      style={{
        background: colors.bg,
        color: colors.color,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
          startTransition(async () => {
            await onClick();
          });
        }
      }}
      disabled={isPending || props.disabled}
      {...props}
    >
      {icon}
    </button>
  );
}
