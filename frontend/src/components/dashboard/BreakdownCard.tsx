import { cn } from "../../utils/cn";
import Card from "../ui/Card";
import ProgressBar from "../ui/ProgressBar";
import CardTitle from "../ui/CardTitle";

export type BreakdownRow = {
  key: string;
  label: string;
  count: number;
  // Text shown on the right; defaults to the count
  valueLabel?: string;
};

type BreakdownCardProps = {
  title: string;
  rows: BreakdownRow[];
  tone?: "brand" | "danger";
  monoValues?: boolean;
};

// A titled list of labelled bars. Each bar shows its share of the total.
function BreakdownCard({
  title,
  rows,
  tone = "brand",
  monoValues = false,
}: BreakdownCardProps) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card padding="md">
      <CardTitle>{title}</CardTitle>

      <ul className="mt-4 space-y-3.5">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-4">
              <span className="text-sm text-gray-600">{row.label}</span>

              <span
                className={cn(
                  "whitespace-nowrap text-sm text-gray-600",
                  monoValues && "font-mono"
                )}
              >
                {row.valueLabel ?? row.count}
              </span>
            </div>

            <ProgressBar value={row.count} max={total} tone={tone} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default BreakdownCard;
