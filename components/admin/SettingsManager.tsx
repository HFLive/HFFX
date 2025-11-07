"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const defaultTarget = "2025-12-30T18:00";

const tipItems = [
  "收款码路径为 public/payment-qr.png",
  "库存数量会在订单提交时自动扣减，可在商品管理中手动调整",
  "后台密码通过环境变量 ADMIN_PASSWORD 控制",
  "Michael Cai, 20251107, All Rights Reserved",
];

type Props = {
  countdownTarget: string | null;
  loading: boolean;
  reloadCountdown: () => Promise<void>;
};

export default function SettingsManager({ countdownTarget, loading, reloadCountdown }: Props) {
  const [value, setValue] = useState(countdownTarget ?? defaultTarget);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setValue(countdownTarget ?? defaultTarget);
  }, [countdownTarget]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/countdown", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: value }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "保存失败");
      }
      setSuccess("已更新倒计时设置");
      await reloadCountdown();
    } catch (err: any) {
      setError(err.message ?? "保存失败，请稍后再试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">首页倒计时设置</h2>
        <p className="text-sm text-foreground-light">
          修改倒计时截止时间后，首页 “距离华附春晚还有” 模块会实时使用新的目标时间。
        </p>
        <form onSubmit={handleSubmit} className="grid gap-3 max-w-md">
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>目标时间</span>
            <input
              type="datetime-local"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="rounded-xl border border-primary/20 px-3 py-2"
              disabled={saving}
              required
            />
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button type="submit" disabled={saving || loading} className="w-full md:w-auto">
            {saving ? "保存中..." : "保存设置"}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">提示</h2>
        <ul className="list-disc list-inside text-foreground-light space-y-2">
          {tipItems.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
