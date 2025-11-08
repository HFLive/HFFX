"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminButton } from "@/components/admin/AdminButton";
import type { AdminTimeline } from "@/components/admin/AdminDashboard";

const initialNewEvent = {
  title: "",
  date: "",
  description: "",
  completed: false,
};

export type EditableEvent = {
  id: string;
  title: string;
  date: string;
  description: string;
  completed: boolean;
};

type Props = {
  timeline: AdminTimeline;
  loading: boolean;
  reload: () => Promise<void>;
};

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function TimelineManager({ timeline, loading, reload }: Props) {
  const [note, setNote] = useState(timeline.note ?? "");
  const [events, setEvents] = useState<EditableEvent[]>([]);
  const [newEvent, setNewEvent] = useState(initialNewEvent);
  const [savingNote, setSavingNote] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setNote(timeline.note ?? "");
    setEvents(
      (timeline.events ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date ?? "",
        description: event.description ?? "",
        completed: Boolean(event.completed),
      }))
    );
  }, [timeline]);

  const count = useMemo(() => timeline.events?.length ?? 0, [timeline.events]);

  const resetStatus = () => {
    setError(null);
    setSuccess(null);
  };

  const validateEvent = (payload: { title: string }) => {
    if (!payload.title.trim()) {
      return "请填写事件标题";
    }
    return null;
  };

  const handleSaveNote = async () => {
    resetStatus();
    setSavingNote(true);
    try {
      const response = await fetch("/api/admin/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "保存失败");
      }
      setSuccess("已更新备注");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "保存失败，请稍后再试");
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();
    const validation = validateEvent({ title: newEvent.title });
    if (validation) {
      setError(validation);
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/admin/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title.trim(),
          date: newEvent.date.trim() || undefined,
          description: newEvent.description.trim() || undefined,
          completed: newEvent.completed,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "新增失败");
      }
      setSuccess("已新增时间线事件");
      setNewEvent(initialNewEvent);
      await reload();
    } catch (err: any) {
      setError(err.message ?? "新增失败，请稍后再试");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEvent = async (item: EditableEvent) => {
    resetStatus();
    const validation = validateEvent({ title: item.title });
    if (validation) {
      setError(validation);
      return;
    }
    setSavingId(item.id);
    try {
      const response = await fetch(`/api/admin/timeline/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title.trim(),
          date: item.date.trim() || undefined,
          description: item.description.trim() || undefined,
          completed: item.completed,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "保存失败");
      }
      setSuccess("已保存事件");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "保存失败，请稍后再试");
    } finally {
      setSavingId(null);
    }
  };

  const handleReorder = async (newOrder: EditableEvent[]) => {
    resetStatus();
    setEvents(newOrder);
    try {
      const response = await fetch("/api/admin/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map((item) => item.id) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "保存顺序失败");
      }
      setSuccess("已更新时间线顺序");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "保存顺序失败，请稍后再试");
    }
  };

  const handleMoveEvent = (eventId: string, direction: "up" | "down") => {
    setEvents((prev) => {
      const index = prev.findIndex((item) => item.id === eventId);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      const reordered = arrayMove(prev, index, nextIndex);
      handleReorder(reordered);
      return reordered;
    });
  };

  const handleDeleteEvent = async (item: EditableEvent) => {
    resetStatus();
    const confirmed = window.confirm(`确定删除时间线事件“${item.title.slice(0, 20)}${item.title.length > 20 ? "..." : ""}”吗？`);
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const response = await fetch(`/api/admin/timeline/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "删除失败");
      }
      setSuccess("已删除事件");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "删除失败，请稍后再试");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-panel space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold text-foreground">时间线备注</h2>
          <span className="text-sm text-foreground-light">共 {count} 条事件</span>
        </div>
        <div className="grid gap-3">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="rounded-xl border border-primary/20 px-3 py-2 text-sm"
            rows={3}
            placeholder="例如：各时间会依据实际情况调整，网站将同步更新"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex justify-end">
            <AdminButton type="button" tone="plain" onClick={handleSaveNote} disabled={savingNote}>
              {savingNote ? "保存中..." : "保存备注"}
            </AdminButton>
          </div>
        </div>
      </section>

      <section className="admin-panel space-y-5">
        <h2 className="text-2xl font-semibold text-foreground">新增事件</h2>
        <form className="grid gap-3" onSubmit={handleCreateEvent}>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>标题</span>
              <input
                value={newEvent.title}
                onChange={(event) => setNewEvent((prev) => ({ ...prev, title: event.target.value }))}
                className="rounded-xl border border-primary/20 px-3 py-2"
                placeholder="请输入事件标题"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>日期（可选）</span>
              <input
                value={newEvent.date}
                onChange={(event) => setNewEvent((prev) => ({ ...prev, date: event.target.value }))}
                className="rounded-xl border border-primary/20 px-3 py-2"
                placeholder="例如：11月30日"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>描述（可选）</span>
            <textarea
              value={newEvent.description}
              onChange={(event) => setNewEvent((prev) => ({ ...prev, description: event.target.value }))}
              className="rounded-xl border border-primary/20 px-3 py-2"
              rows={3}
              placeholder="补充事件描述"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={newEvent.completed}
              onChange={(event) => setNewEvent((prev) => ({ ...prev, completed: event.target.checked }))}
              className="h-4 w-4 rounded border-primary/40"
            />
            标记为已完成
          </label>
          <AdminButton type="submit" disabled={creating}>
            {creating ? "添加中..." : "添加事件"}
          </AdminButton>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">时间线事件</h2>
        {loading ? (
          <div className="admin-panel text-center">
            正在加载时间线...
          </div>
        ) : events.length === 0 ? (
          <div className="admin-panel text-center">
            暂无事件，请先新增。
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event, index) => {
              const isProcessing = savingId === event.id || deletingId === event.id;
              return (
                <div key={event.id} className="relative admin-panel space-y-4">
                  <div className="flex items-center gap-2 absolute right-4 top-4">
                    <AdminButton
                      type="button"
                      tone="ghost"
                      onClick={() => handleMoveEvent(event.id, "up")}
                      disabled={isProcessing || index === 0}
                      className="text-xs"
                    >
                      上移
                    </AdminButton>
                    <AdminButton
                      type="button"
                      tone="ghost"
                      onClick={() => handleMoveEvent(event.id, "down")}
                      disabled={isProcessing || index === events.length - 1}
                      className="text-xs"
                    >
                      下移
                    </AdminButton>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>标题</span>
                      <input
                        value={event.title}
                        onChange={(e) =>
                          setEvents((prev) =>
                            prev.map((item) => (item.id === event.id ? { ...item, title: e.target.value } : item))
                          )
                        }
                        className="rounded-xl border border-primary/20 px-3 py-2"
                        disabled={isProcessing}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-foreground">
                      <span>日期（可选）</span>
                      <input
                        value={event.date}
                        onChange={(e) =>
                          setEvents((prev) =>
                            prev.map((item) => (item.id === event.id ? { ...item, date: e.target.value } : item))
                          )
                        }
                        className="rounded-xl border border-primary/20 px-3 py-2"
                        disabled={isProcessing}
                      />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    <span>描述（可选）</span>
                    <textarea
                      value={event.description}
                      onChange={(e) =>
                        setEvents((prev) =>
                          prev.map((item) =>
                            item.id === event.id ? { ...item, description: e.target.value } : item
                          )
                        )
                      }
                      className="rounded-xl border border-primary/20 px-3 py-2"
                      rows={3}
                      disabled={isProcessing}
                    />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={event.completed}
                        onChange={(e) =>
                          setEvents((prev) =>
                            prev.map((item) =>
                              item.id === event.id ? { ...item, completed: e.target.checked } : item
                            )
                          )
                        }
                        className="h-4 w-4 rounded border-primary/40"
                        disabled={isProcessing}
                      />
                      标记为已完成
                    </label>
                    <div className="flex items-center gap-2">
                      <AdminButton
                        type="button"
                        tone="plain"
                        onClick={() => handleSaveEvent(event)}
                        disabled={isProcessing}
                      >
                        {savingId === event.id ? "保存中..." : "保存"}
                      </AdminButton>
                      <AdminButton
                        type="button"
                        tone="danger"
                        onClick={() => handleDeleteEvent(event)}
                        disabled={isProcessing}
                      >
                        {deletingId === event.id ? "删除中..." : "删除"}
                      </AdminButton>
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

