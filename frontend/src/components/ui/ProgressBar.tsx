import { cn } from "../../utils/cn";

export type ProgressTone = "brand" | "success" | "warning" | "danger";

type ProgressBarProps = {
  value: number;
  max: number;
  tone?: ProgressTone;
  className?: string;
};

const toneClasses: Record<ProgressTone, string> = {
  brand: "bg-brand-strong/85",
  success: "bg-success/90",
  warning: "bg-warning/90",
  danger: "bg-danger/85",
};

function ProgressBar({
  value,
  max,
  tone = "brand",
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-track", className)}
    >
      <div
        className={cn("h-full rounded-full", toneClasses[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default ProgressBar;
