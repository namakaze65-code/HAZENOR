import React from "react";
import { BadgeVariant } from "@/lib/terminology";

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, { badge: string; dot: string }> = {
  success: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-600",
  },
  warning: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  danger: {
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-600",
  },
  info: {
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    dot: "bg-blue-600",
  },
  neutral: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
  },
};

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  const style = variantClasses[variant] || variantClasses.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
