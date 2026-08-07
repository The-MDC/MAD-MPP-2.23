import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "gold" | "neon" | "pink" | "none";
  sheen?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = "none", sheen = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-neutral-950/80 backdrop-blur-md p-6 transition-all duration-300",
          glow === "none" && "border-[1.15px] border-neutral-850",
          glow === "gold" && "border-glow-gold gold-flakes",
          glow === "neon" && "border-glow-neon",
          glow === "pink" && "border-glow-pink",
          sheen && "liquid-gold-sheen",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
