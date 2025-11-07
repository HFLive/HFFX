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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 px-4">
      <div className="w-full max-w-md rounded-3xl border border-primary/10 bg-white/90 backdrop-blur p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-center text-primary mb-6">后台登录</h1>
        <p className="text-sm text-foreground-light text-center mb-6">
          请输入后台管理密码访问商城管理面板。
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border border-primary/20 px-3 py-2"
              placeholder="后台密码"
              required
            />
          </label>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-2xl bg-primary px-4 py-3 text-white font-semibold shadow-lg shadow-primary/30 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录后台"}
          </button>
        </form>
      </div>
    </div>
  );
}
