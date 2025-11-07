"use client";

import { useState } from "react";

export default function AdminLoginDebugPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test: string, status: "success" | "error" | "info", message: string, details?: any) => {
    setTestResults(prev => [...prev, { test, status, message, details, time: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);

    // 测试 1: 检查环境变量
    addResult("环境变量", "info", "开始检查环境变量...");
    try {
      const envResponse = await fetch("/api/admin/login/debug", {
        method: "GET",
      });
      const envData = await envResponse.json();
      if (envData.hasPassword) {
        addResult("环境变量", "success", "ADMIN_PASSWORD 已设置");
      } else {
        addResult("环境变量", "error", "ADMIN_PASSWORD 未设置", envData);
      }
    } catch (err: any) {
      addResult("环境变量", "error", "检查失败: " + err.message, err);
    }

    // 测试 2: 测试 API 连接
    addResult("API 连接", "info", "测试 /api/admin/login 端点...");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "test_wrong_password" }),
        credentials: "include",
      });
      const data = await response.json();
      if (response.status === 401) {
        addResult("API 连接", "success", "API 端点正常响应", { status: response.status, data });
      } else {
        addResult("API 连接", "error", "意外的响应", { status: response.status, data });
      }
    } catch (err: any) {
      addResult("API 连接", "error", "连接失败: " + err.message, err);
    }

    // 测试 3: 检查 Cookie 支持
    addResult("Cookie 支持", "info", "检查浏览器 Cookie 支持...");
    try {
      document.cookie = "test_cookie=1; path=/";
      const cookies = document.cookie;
      if (cookies.includes("test_cookie")) {
        addResult("Cookie 支持", "success", "浏览器支持 Cookie");
        document.cookie = "test_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
      } else {
        addResult("Cookie 支持", "error", "浏览器可能禁用了 Cookie");
      }
    } catch (err: any) {
      addResult("Cookie 支持", "error", "检查失败: " + err.message, err);
    }

    // 测试 4: 检查 HTTPS
    addResult("HTTPS", "info", "检查协议...");
    if (window.location.protocol === "https:") {
      addResult("HTTPS", "success", "使用 HTTPS 协议");
    } else {
      addResult("HTTPS", "info", "使用 HTTP 协议（生产环境建议使用 HTTPS）");
    }

    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">后台登录诊断工具</h1>
          <p className="text-slate-600 mb-4">
            此页面用于诊断后台登录问题。点击下方按钮运行诊断测试。
          </p>
          <button
            onClick={runTests}
            disabled={testing}
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            {testing ? "测试中..." : "运行诊断"}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">测试结果</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status === "success"
                      ? "bg-green-50 border-green-500"
                      : result.status === "error"
                      ? "bg-red-50 border-red-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{result.test}</h3>
                      <p className="text-sm text-slate-600 mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer">
                            查看详情
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-slate-100 rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span
                      className={`ml-4 px-2 py-1 text-xs font-semibold rounded ${
                        result.status === "success"
                          ? "bg-green-100 text-green-800"
                          : result.status === "error"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {result.status === "success" ? "✓" : result.status === "error" ? "✗" : "ℹ"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">调试建议</h3>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>检查浏览器控制台是否有 JavaScript 错误</li>
            <li>确认 .env 文件中已设置 ADMIN_PASSWORD</li>
            <li>确认 PM2 进程正在运行（pm2 list）</li>
            <li>检查 PM2 日志（pm2 logs hsfx-site）</li>
            <li>尝试清除浏览器缓存和 Cookie</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <a href="/admin/login" className="text-primary hover:underline">
            返回登录页面
          </a>
        </div>
      </div>
    </div>
  );
}

