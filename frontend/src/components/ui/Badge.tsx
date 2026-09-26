import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export type BadgeTone = "neutral" | "info" | "success" | "danger";

type BadgeProps = {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-500",
  info: "bg-blue-50 text-blue-600",
  success: "bg-green-50 text-green-600",
  danger: "bg-red-50 text-red-600",
};

function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
