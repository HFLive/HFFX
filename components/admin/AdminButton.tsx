"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "plain" | "ghost" | "danger";
};

const baseClass =
  "inline-flex items-center justify-center uppercase tracking-[0.3em] font-semibold px-5 py-2 text-xs md:text-sm border transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60";

const toneClass: Record<NonNullable<AdminButtonProps["tone"]>, string> = {
  primary: "border-emerald-500 text-emerald-200 bg-black/70 hover:bg-emerald-500 hover:text-black",
  plain: "border-emerald-500/60 text-emerald-300 bg-transparent hover:bg-emerald-500/15",
  ghost: "border-transparent text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/10",
  danger: "border-red-500/70 text-red-400 hover:bg-red-500 hover:text-black",
};

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ tone = "primary", className, type = "button", ...props }, ref) => {
    return <button ref={ref} type={type} className={cn(baseClass, toneClass[tone], className)} {...props} />;
  }
);

AdminButton.displayName = "AdminButton";


