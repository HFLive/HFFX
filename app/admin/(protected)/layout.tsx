import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  if (!isAdminRequest()) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
