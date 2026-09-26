import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type PageHeaderProps = {
  title: string;
  // Small text above the title, e.g. "Workspace" or "REQ-0042"
  eyebrow?: string;
  eyebrowMono?: boolean;
  description?: string | null;
  // Buttons / badges on the right
  actions?: ReactNode;
};

function PageHeader({
  title,
  eyebrow,
  eyebrowMono = false,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p
            className={cn(
              "text-gray-500",
              eyebrowMono ? "font-mono text-xs" : "text-sm"
            )}
          >
            {eyebrow}
          </p>
        )}

        <h1 className="mt-0.5 font-heading text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
