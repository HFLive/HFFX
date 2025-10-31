"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const links = [
  { href: "/", label: "首页" },
  { href: "/products", label: "周边文创" },
  { href: "/timeline", label: "时间线" },
  { href: "/survey", label: "问卷调查" },
  { href: "/team", label: "团队名录" },
];

const desktopTabClass = (active: boolean) =>
  [
    "px-4 py-2 rounded-full transition-all duration-200 font-medium",
    active
      ? "bg-primary text-white font-semibold shadow-sm"
      : "text-primary/80 hover:bg-primary/10 hover:text-primary",
  ].join(" ");

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, mounted]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-gray-200 shadow-sm py-2">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 select-none">
          <span className="font-black text-2xl text-primary tracking-tight">HFFX</span>
        </Link>

        <ul className="hidden md:flex flex-wrap items-center gap-2 text-base">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={desktopTabClass(isActive(link.href))}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-primary hover:bg-primary/10 transition"
          aria-label="打开导航菜单"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {mounted && open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-x-4 top-24 rounded-3xl bg-white shadow-2xl border border-primary/10 p-6 z-[1000] animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-foreground">导航菜单</span>
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center rounded-full p-2 text-primary hover:bg-primary/10 transition"
                  aria-label="关闭导航菜单"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-all border ${
                        isActive(link.href)
                          ? "border-primary/60 bg-primary/10 text-primary font-semibold"
                          : "border-transparent bg-gray-50 hover:bg-primary/5 text-primary/80"
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="text-xs text-primary/60">前往</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>,
          document.body
        )}
    </nav>
  );
}
