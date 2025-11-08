"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "@/components/admin/AdminButton";

const defaultTarget = "2025-12-30T18:00";
const defaultQrPath = "/payment-qr.png";

const tipItems = [
  "收款码支持在此上传，默认位于 public/payment-qr.png",
  "库存数量会在订单提交时自动扣减，可在商品管理中手动调整",
  "后台密码通过环境变量 ADMIN_PASSWORD 控制",
  "Michael Cai, 20251107, All Rights Reserved",
];

type Props = {
  countdownTarget: string | null;
  countdownLoading: boolean;
  reloadCountdown: (options?: { silent?: boolean }) => Promise<void>;
  paymentQrPath: string | null;
  paymentQrLoading: boolean;
  reloadPaymentQr: (options?: { silent?: boolean }) => Promise<void>;
};

export default function SettingsManager({
  countdownTarget,
  countdownLoading,
  reloadCountdown,
  paymentQrPath,
  paymentQrLoading,
  reloadPaymentQr,
}: Props) {
  const [value, setValue] = useState(countdownTarget ?? defaultTarget);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessages, setToastMessages] = useState<{ id: string; text: string }[]>([]);
  const [mounted, setMounted] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(countdownTarget ?? defaultTarget);
  }, [countdownTarget]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showToast = (message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToastMessages((prev) => [...prev, { id, text: message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const countdownDirty = value !== (countdownTarget ?? defaultTarget);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
      showToast("已更新倒计时设置");
      await reloadCountdown({ silent: true });
    } catch (err: any) {
      setError(err.message ?? "保存失败，请稍后再试");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("仅支持上传图片文件");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("文件大小不能超过 5MB");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("请选择要上传的图片");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch("/api/admin/settings/payment-qr", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "上传失败");
      }
      showToast("已更新收款码");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await reloadPaymentQr({ silent: true });
    } catch (err: any) {
      setUploadError(err.message ?? "上传失败，请稍后再试");
    } finally {
      setUploading(false);
    }
  };

  const effectiveQrPath = previewUrl ?? paymentQrPath ?? defaultQrPath;

  return (
    <div className="space-y-6">
      {mounted && toastMessages.length > 0 &&
        createPortal(
          <div className="pointer-events-none fixed bottom-6 right-6 z-[1000]">
            {toastMessages.map((toast, index) => (
              <div
                key={toast.id}
                className="bg-emerald-500/15 border border-emerald-400/70 text-emerald-200 uppercase tracking-[0.28em] text-xs px-4 py-2 shadow-[0_0_24px_rgba(16,185,129,0.35)] rounded-none"
                style={{
                  position: "absolute",
                  bottom: `${index * 60}px`,
                  right: 0,
                  whiteSpace: "nowrap",
                  maxWidth: "300px",
                }}
              >
                {toast.text}
              </div>
            ))}
          </div>,
          document.body
        )}
      <section className="admin-panel space-y-5">
        <h2 className="text-2xl font-semibold text-foreground">首页倒计时设置</h2>
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
          <AdminButton
            type="submit"
            disabled={saving || countdownLoading || !countdownDirty}
            className="w-full md:w-auto"
          >
            {saving ? "保存中..." : "保存设置"}
          </AdminButton>
        </form>
      </section>

      <section className="admin-panel space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">收款码管理</h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-start">
          <div className="flex flex-col items-center gap-3 text-sm text-foreground-light">
            <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5">
              {paymentQrLoading && !previewUrl ? (
                <div className="flex h-full w-full items-center justify-center text-xs text-foreground-light/70">
                  加载中...
                </div>
              ) : (
                <img
                  src={effectiveQrPath}
                  alt="当前收款二维码"
                  className="h-full w-full object-contain"
                />
              )}
            </div>
            <span className="text-xs text-foreground-light/80">
              当前路径：{paymentQrPath ?? defaultQrPath}
            </span>
          </div>
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
              <span>上传新二维码</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="rounded-xl border border-primary/20 px-3 py-2 text-sm"
                disabled={uploading}
              />
              <span className="text-xs text-foreground-light">
                支持 JPG、PNG、WEBP 等常见图片格式，体积需小于 5MB。
              </span>
            </label>
            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
            <div className="flex flex-wrap gap-3">
              <AdminButton
                type="button"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full md:w-auto"
              >
                {uploading ? "上传中..." : "上传并替换"}
              </AdminButton>
              <AdminButton
                type="button"
                tone="plain"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setUploadError(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              disabled={uploading || (!selectedFile && !previewUrl)}
              >
                清除选择
              </AdminButton>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel space-y-5">
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
