"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "@/components/admin/AdminButton";
import type { AdminDanmaku } from "@/components/admin/AdminDashboard";

type Props = {
  danmaku: AdminDanmaku[];
  loading: boolean;
  reload: () => Promise<void>;
};

type EditableDanmaku = {
  id: string;
  text: string;
  color: string;
};

const defaultNewDanmaku = {
  text: "",
  color: "",
};

const QUICK_COLORS = [
  { label: "黑色", value: "#000000" },
  { label: "主题绿", value: "#29957F" },
];

export default function DanmakuManager({ danmaku, loading, reload }: Props) {
  const [toastMessages, setToastMessages] = useState<{ id: string; text: string }[]>([]);
  const [newDanmaku, setNewDanmaku] = useState(defaultNewDanmaku);
  const [editableItems, setEditableItems] = useState<EditableDanmaku[]>([]);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const originalDanmakuRef = useRef<Record<string, EditableDanmaku>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mapped = danmaku.map((item) => ({
      id: item.id,
      text: item.text,
      color: item.color ?? "",
    }));
    originalDanmakuRef.current = mapped.reduce<Record<string, EditableDanmaku>>((acc, entry) => {
      acc[entry.id] = { ...entry };
      return acc;
    }, {});
    setEditableItems(mapped);
  }, [danmaku]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const totalCount = useMemo(() => danmaku.length, [danmaku]);

  const resetStatus = () => {
    setError(null);
  };

  const showToast = (message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToastMessages((prev) => [...prev, { id, text: message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  };

  const isItemDirty = (item: EditableDanmaku) => {
    const original = originalDanmakuRef.current[item.id];
    if (!original) return true;
    return item.text !== original.text || item.color !== original.color;
  };

  const canCreate = newDanmaku.text.trim().length > 0;

  const validateText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return "弹幕内容不能为空";
    }
    if (trimmed.length > 120) {
      return "弹幕内容不应超过 120 个字符";
    }
    return null;
  };

  const normalizeColor = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (/^#([0-9a-fA-F]{3}){1,2}$/.test(trimmed) || /^rgb(a)?\(/.test(trimmed)) {
      return trimmed;
    }
    setError("颜色格式不正确，请使用 #RGB / #RRGGBB 或 rgb()/rgba()");
    return null;
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    const validation = validateText(newDanmaku.text);
    if (validation) {
      setError(validation);
      return;
    }
    const color = newDanmaku.color ? normalizeColor(newDanmaku.color) : "";
    if (color === null) return;

    setCreating(true);
    try {
      const response = await fetch("/api/admin/danmaku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newDanmaku.text.trim(),
          color: color || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "新增失败");
      }
      showToast("已新增弹幕");
      setNewDanmaku(defaultNewDanmaku);
      await reload();
    } catch (err: any) {
      setError(err.message ?? "新增失败，请稍后再试");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (item: EditableDanmaku) => {
    resetStatus();
    const validation = validateText(item.text);
    if (validation) {
      setError(validation);
      return;
    }
    const color = item.color ? normalizeColor(item.color) : "";
    if (color === null) return;

    setSavingId(item.id);
    try {
      const response = await fetch(`/api/admin/danmaku/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: item.text.trim(),
          color: color ?? undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "保存失败");
      }
      showToast("已保存弹幕");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "保存失败，请稍后再试");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item: EditableDanmaku) => {
    resetStatus();
    const confirmed = window.confirm(`确定删除弹幕“${item.text.slice(0, 12)}${item.text.length > 12 ? "..." : ""}”吗？`);
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/admin/danmaku/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "删除失败");
      }
      showToast("已删除弹幕");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "删除失败，请稍后再试");
    } finally {
      setDeletingId(null);
    }
  };

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
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold text-foreground">新增弹幕</h2>
          <span className="text-sm text-foreground-light">当前共 {totalCount} 条弹幕</span>
        </div>
        <form className="grid gap-3" onSubmit={handleCreate}>
          <textarea
            value={newDanmaku.text}
            onChange={(event) => setNewDanmaku((prev) => ({ ...prev, text: event.target.value }))}
            className="rounded-xl border border-primary/20 px-3 py-2 text-sm"
            rows={3}
            placeholder="输入要在首页飘过的文字内容"
            maxLength={160}
          />
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">颜色（可选）</label>
            <input
              value={newDanmaku.color}
              onChange={(event) => setNewDanmaku((prev) => ({ ...prev, color: event.target.value }))}
              className="rounded-xl border border-primary/20 px-3 py-2 text-sm"
              placeholder="#FF5722 或 rgba(255,87,34,0.85)"
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_COLORS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setNewDanmaku((prev) => ({ ...prev, color: option.value }))}
                  className="px-3 py-1 text-xs uppercase tracking-[0.3em] border border-emerald-500/60 bg-black/60 text-emerald-200 hover:bg-emerald-500/20"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <AdminButton type="submit" disabled={creating || !canCreate} className="w-full md:w-auto">
            {creating ? "添加中..." : "添加弹幕"}
          </AdminButton>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">弹幕列表</h2>
        {loading ? (
          <div className="admin-panel text-center">
            正在加载弹幕...
          </div>
        ) : danmaku.length === 0 ? (
          <div className="admin-panel text-center">
            暂无弹幕，请先新增。
          </div>
        ) : (
          <div className="grid gap-4">
            {editableItems.map((item) => {
              const isProcessing = savingId === item.id || deletingId === item.id;
              return (
                <div key={item.id} className="admin-panel space-y-3">
                  <textarea
                    value={item.text}
                    onChange={(event) =>
                      setEditableItems((prev) =>
                        prev.map((row) => (row.id === item.id ? { ...row, text: event.target.value } : row))
                      )
                    }
                    className="w-full rounded-xl border border-primary/20 px-3 py-2 text-sm"
                    rows={3}
                    maxLength={160}
                  />
                  <div className="grid md:grid-cols-[1fr_auto] gap-3 items-center">
                    <div className="flex flex-col gap-1 text-xs text-foreground-light">
                      <span>
                        ID: <code>{item.id}</code>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">颜色（可选）</span>
                        <input
                          value={item.color}
                          onChange={(event) =>
                            setEditableItems((prev) =>
                              prev.map((row) => (row.id === item.id ? { ...row, color: event.target.value } : row))
                            )
                          }
                          className="w-36 rounded-xl border border-primary/20 px-3 py-1 text-sm"
                          placeholder="#FFFFFF"
                        />
                        <span
                          className="inline-flex h-6 w-6 rounded-full border border-primary/20"
                          style={{ backgroundColor: item.color || "#ffffff" }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <div className="flex gap-2">
                        {QUICK_COLORS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setEditableItems((prev) =>
                                prev.map((row) =>
                                  row.id === item.id ? { ...row, color: option.value } : row
                                )
                              )
                            }
                            className="px-3 py-1 text-xs uppercase tracking-[0.3em] border border-emerald-500/60 bg-black/60 text-emerald-200 hover:bg-emerald-500/20"
                            disabled={isProcessing}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                      <AdminButton
                        type="button"
                        tone="plain"
                        onClick={() => handleSave(item)}
                        disabled={isProcessing || !isItemDirty(item)}
                      >
                        {savingId === item.id ? "保存中..." : "保存"}
                      </AdminButton>
                      <AdminButton
                        type="button"
                        tone="danger"
                        onClick={() => handleDelete(item)}
                        disabled={isProcessing}
                      >
                        {deletingId === item.id ? "删除中..." : "删除"}
                      </AdminButton>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

