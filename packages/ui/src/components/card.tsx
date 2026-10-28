import React from "react";
import { cn } from "../utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-main bg-bg-primary p-6 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
