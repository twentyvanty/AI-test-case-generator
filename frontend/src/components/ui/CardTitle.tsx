import type { ReactNode } from "react";

type CardTitleProps = {
  children: ReactNode;
  // Small monospace text on the right, e.g. "56 cases"
  aside?: ReactNode;
};

function CardTitle({ children, aside }: CardTitleProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
        {children}
      </h2>

      {aside && (
        <span className="font-mono text-xs text-gray-500">{aside}</span>
      )}
    </div>
  );
}

export default CardTitle;
