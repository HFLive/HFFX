import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  if (!isAdminRequest()) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-root relative min-h-screen overflow-hidden bg-black">
      <div className="admin-grid-overlay" />
      <div className="admin-scanline-overlay" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="admin-shell">{children}</div>
      </div>
    </div>
  );
}
