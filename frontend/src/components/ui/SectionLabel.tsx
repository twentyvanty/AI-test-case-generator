import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

// Small uppercase label used above groups, e.g. "SECTIONS", "RECENT RUNS"
function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gray-500",
        className
      )}
    >
      {children}
    </p>
  );
}

export default SectionLabel;
