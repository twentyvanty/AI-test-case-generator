import type { LabelHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

// Uppercase form label, e.g. "REQUIREMENT TEXT"
function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-xs font-medium uppercase tracking-wider text-gray-600",
        className
      )}
      {...props}
    />
  );
}

export default FieldLabel;
