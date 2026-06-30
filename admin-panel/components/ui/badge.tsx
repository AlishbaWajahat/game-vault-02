import * as React from "react";
import { cn } from "@/lib/utils";

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: { backgroundColor: "var(--primary)", color: "var(--primary-foreground)", borderColor: "transparent" },
  secondary: { backgroundColor: "#ffffff", color: "var(--secondary-foreground)", borderColor: "var(--border)" },
  destructive: { backgroundColor: "var(--destructive)", color: "var(--destructive-foreground)", borderColor: "transparent" },
  outline: { color: "var(--foreground)" },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant = "default", style, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        className,
      )}
      style={{ ...VARIANT_STYLES[variant], ...style }}
      {...props}
    />
  );
}

export { Badge };
