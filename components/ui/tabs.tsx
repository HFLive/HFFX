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
      <div className={cn("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("inline-flex rounded-2xl border border-primary/10 bg-white p-1 shadow-sm", className)}>{children}</div>;
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
        "px-4 py-2 rounded-xl text-sm font-medium transition",
        active ? "bg-primary text-white shadow" : "text-foreground hover:bg-primary/10"
      , className)}
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
