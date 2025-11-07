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
    
    console.log("[登录] 开始登录流程...");
    
    try {
      console.log("[登录] 发送登录请求到 /api/admin/login");
      
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include", // 确保包含 cookies
      });
      
      console.log("[登录] 收到响应，状态码:", response.status);
      
      const data = await response.json().catch((err) => {
        console.error("[登录] 解析响应 JSON 失败:", err);
        return {};
      });
      
      console.log("[登录] 响应数据:", data);
      
      if (!response.ok) {
        const errorMsg = data.message ?? "登录失败";
        console.error("[登录] 登录失败:", errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log("[登录] 登录成功，准备跳转...");
      
      // 登录成功，等待一小段时间确保 cookie 已设置
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log("[登录] 执行跳转到 /admin");
      
      // 使用 window.location 进行完整的页面重定向，确保 cookie 生效
      window.location.href = "/admin";
    } catch (err: any) {
      console.error("[登录] 捕获错误:", err);
      setError(err.message ?? "登录失败，请稍后再试");
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
              <p className="font-semibold">登录失败</p>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-xs text-red-500">
                提示：请检查浏览器控制台查看详细错误信息
              </p>
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
