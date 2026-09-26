import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type CardPadding = "none" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  md: "p-5",
  lg: "p-6",
};

function Card({ padding = "lg", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/80 bg-white/60 shadow-sm backdrop-blur-md",
        paddingClasses[padding],
        className
      )}
      {...props}
    />
  );
}

export default Card;
