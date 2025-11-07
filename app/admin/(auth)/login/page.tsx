"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "登录失败");
      }
      router.replace("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "登录失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-emerald-400">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px), linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage: "linear-gradient(transparent 0%, rgba(16,185,129,0.4) 2%, transparent 4%)",
          backgroundSize: "100% 6px",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md border-2 border-emerald-500 bg-black/80 p-8 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
          <div className="mb-8 space-y-3 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-emerald-600">system override</p>
            <h1 className="text-3xl font-mono uppercase tracking-[0.35em] text-emerald-300">
              admin access
            </h1>
            <p className="font-mono text-xs text-emerald-500">
              {"> 输入认证密钥以解除安全防护"}
            </p>
          </div>

          <form className="space-y-6 font-mono" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-left">
              <span className="text-xs uppercase tracking-[0.35em] text-emerald-500">root password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border border-emerald-500/60 bg-black px-4 py-3 text-emerald-100 tracking-widest placeholder:text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="********"
                required
              />
            </label>

            {error && (
              <div className="border border-red-600 bg-red-950/70 px-4 py-3 text-xs uppercase tracking-[0.3em] text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full border-2 border-emerald-500 bg-black px-4 py-3 text-sm uppercase tracking-[0.45em] text-emerald-300 transition-all duration-200 hover:bg-emerald-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:border-emerald-800 disabled:text-emerald-700"
              disabled={loading}
            >
              {loading ? "scanning..." : "initiate login"}
            </button>
          </form>

          <div className="mt-8 space-y-2 border-t border-emerald-900 pt-4 text-xs text-emerald-600">
            <p className="font-mono">status: {loading ? "establishing secure channel" : "standby"}</p>
            <p className="font-mono">protocol: hf-admin-net v2.5</p>
          </div>
        </div>
      </div>
    </div>
  );
}
