import { cn } from "../../utils/cn";

type SpinnerProps = {
  label?: string;
  className?: string;
};

function Spinner({ label, className }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn("flex items-center gap-3 text-gray-500", className)}
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />

      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export default Spinner;
