import { cn } from "../../utils/cn";
import Card from "../ui/Card";

type StatTone = "default" | "success" | "danger";

type StatCardProps = {
  label: string;
  value: string;
  delta: string;
  tone?: StatTone;
};

const toneClasses: Record<StatTone, string> = {
  default: "text-ink",
  success: "text-success",
  danger: "text-danger",
};

function StatCard({ label, value, delta, tone = "default" }: StatCardProps) {
  return (
    <Card padding="md">
      <p className="text-sm text-gray-600">{label}</p>

      <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5">
        <span
          className={cn(
            "font-heading text-3xl font-semibold tracking-tight",
            toneClasses[tone]
          )}
        >
          {value}
        </span>

        <span className="font-mono text-xs text-gray-500">{delta}</span>
      </div>
    </Card>
  );
}

export default StatCard;
