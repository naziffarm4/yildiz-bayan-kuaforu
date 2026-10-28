import React from "react";
import { cn } from "../utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "pink" | "gray" | "green" | "amber" | "outline";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "gold",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors";

  const variantStyles = {
    gold: "bg-primary/10 text-primary border border-primary/30",
    pink: "bg-primary/15 text-primary border border-primary/40",
    gray: "bg-bg-secondary text-text-secondary border border-border-main",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    outline: "border border-border-main text-text-primary",
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
};
