import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60";
    const variants = {
      primary: "bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90",
      outline: "border border-primary/20 text-primary hover:border-primary/40 hover:bg-primary/5",
      ghost: "text-primary hover:bg-primary/10",
    } as const;
    return (
      <button ref={ref} type={type} className={cn(base, variants[variant], className)} {...props} />
    );
  }
);

Button.displayName = "Button";
