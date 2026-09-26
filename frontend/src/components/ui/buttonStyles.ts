import { cn } from "../../utils/cn";

export type ButtonVariant =
  | "primary" // dark — main action on a page
  | "brand" // teal — main action inside a card
  | "secondary" // white outline
  | "ghost" // text only
  | "danger"; // soft red — delete

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft",
  brand: "bg-brand-strong text-white hover:bg-brand-strong/90",
  secondary: "border border-gray-200 bg-white/80 text-ink hover:bg-white",
  ghost: "text-gray-600 hover:bg-white/60 hover:text-ink",
  danger: "bg-danger/10 text-danger hover:bg-danger/15",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

// Shared by <Button> and <ButtonLink> so links can look like buttons
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}
