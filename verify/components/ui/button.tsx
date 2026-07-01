"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "neon" | "gold" | "outline";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 px-3 py-1 text-xs",
          size === "xs" && "h-7 px-2 text-[11px]",
          size === "lg" && "h-11 px-8 py-3",
          size === "icon" && "h-10 w-10",
          variant === "default" && "bg-neutral-900 border border-neutral-800 text-neutral-100 hover:bg-neutral-800",
          variant === "neon" && "bg-cyan-950/40 border-glow-neon text-cyan-300 hover:bg-cyan-900/60",
          variant === "gold" && "bg-yellow-950/40 border-glow-gold text-yellow-300 hover:bg-yellow-900/60 liquid-gold-sheen",
          variant === "outline" && "border border-neutral-750 bg-transparent text-neutral-300 hover:bg-neutral-900",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
