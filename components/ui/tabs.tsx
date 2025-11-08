"use client";

import { createContext, ReactNode, useContext } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ value, onValueChange, children, className }: { value: string; onValueChange: (value: string) => void; children: ReactNode; className?: string }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-6", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex border border-emerald-500/60 bg-black/60 p-1.5 uppercase tracking-[0.3em] text-xs text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");
  const active = context.value === value;
  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        "px-5 py-3 text-xs md:text-sm uppercase tracking-[0.3em] transition-colors duration-150",
        active
          ? "bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.35)]"
          : "text-emerald-300 hover:bg-emerald-500/15",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");
  if (context.value !== value) return null;
  return <div className="space-y-4">{children}</div>;
}
