"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "@/components/admin/AdminButton";
import type { AdminSurvey } from "@/components/admin/AdminDashboard";

const initialNewSurvey = {
  slug: "",
  title: "",
  description: "",
  url: "",
  embedHtml: "",
};

type EditableSurvey = {
  originalSlug: string;
  slug: string;
  title: string;
  description: string;
  url: string;
  embedHtml: string;
};

type Props = {
  surveys: AdminSurvey[];
  loading: boolean;
  reload: () => Promise<void>;
};

export default function SurveyManager({ surveys, loading, reload }: Props) {
  const [toastMessages, setToastMessages] = useState<{ id: string; text: string }[]>([]);
  const [newSurvey, setNewSurvey] = useState(initialNewSurvey);
  const [editableSurveys, setEditableSurveys] = useState<EditableSurvey[]>([]);
  const [creating, setCreating] = useState(false);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const originalSurveysRef = useRef<Record<string, EditableSurvey>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mapped = surveys.map((item) => ({
      originalSlug: item.slug,
      slug: item.slug,
      title: item.title,
      description: item.description ?? "",
      url: item.url ?? "",
      embedHtml: item.embedHtml ?? "",
    }));
    originalSurveysRef.current = mapped.reduce<Record<string, EditableSurvey>>((acc, survey) => {
      acc[survey.originalSlug] = { ...survey };
      return acc;
    }, {});
    setEditableSurveys(mapped);
  }, [surveys]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const totalCount = useMemo(() => surveys.length, [surveys]);

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

  const isSurveyDirty = (survey: EditableSurvey) => {
    const original = originalSurveysRef.current[survey.originalSlug];
    if (!original) return true;
    return (
      survey.slug !== original.slug ||
      survey.title !== original.title ||
      survey.description !== original.description ||
      survey.url !== original.url ||
      survey.embedHtml !== original.embedHtml
    );
  };

  const handleNewSurveyChange = (field: keyof typeof initialNewSurvey, value: string) => {
    setNewSurvey((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditableChange = (index: number, field: keyof EditableSurvey, value: string) => {
    setEditableSurveys((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const validateSurvey = (payload: {
    slug: string;
    title: string;
    description: string;
    url: string;
    embedHtml: string;
  }) => {
    if (!payload.slug) {
      return "请填写问卷 slug（仅限字母、数字和短横线）";
    }
    if (!/^[a-z0-9-]+$/.test(payload.slug)) {
      return "slug 仅能包含字母、数字和短横线";
    }
    if (!payload.title) {
      return "请填写问卷标题";
    }
    if (!payload.url && !payload.embedHtml) {
      return "请至少填写问卷链接或嵌入代码";
    }
    return null;
  };

  const handleCreateSurvey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    const payload = {
      slug: newSurvey.slug.trim().toLowerCase(),
      title: newSurvey.title.trim(),
      description: newSurvey.description.trim(),
      url: newSurvey.url.trim(),
      embedHtml: newSurvey.embedHtml.trim(),
    };

    const validationMessage = validateSurvey(payload);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    if (surveys.some((item) => item.slug === payload.slug)) {
      setError("slug 已存在，请更换");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: payload.slug,
          title: payload.title,
          description: payload.description || undefined,
          url: payload.url || undefined,
          embedHtml: payload.embedHtml || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "创建失败");
      }
      showToast("已创建问卷");
      setNewSurvey(initialNewSurvey);
      await reload();
    } catch (err: any) {
      setError(err.message ?? "创建失败，请稍后再试");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveSurvey = async (index: number) => {
    resetStatus();
    const item = editableSurveys[index];
    if (!item) return;

    const payload = {
      slug: item.slug.trim().toLowerCase(),
      title: item.title.trim(),
      description: item.description.trim(),
      url: item.url.trim(),
      embedHtml: item.embedHtml.trim(),
    };

    const validationMessage = validateSurvey(payload);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    if (
      payload.slug !== item.originalSlug &&
      surveys.some((survey) => survey.slug === payload.slug)
    ) {
      setError("slug 已存在，请更换");
      return;
    }

    setSavingSlug(item.originalSlug);
    try {
      const response = await fetch(`/api/admin/surveys/${encodeURIComponent(item.originalSlug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: payload.slug,
          title: payload.title,
          description: payload.description || undefined,
          url: payload.url,
          embedHtml: payload.embedHtml,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "保存失败");
      }
      showToast("已保存问卷");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "保存失败，请稍后再试");
    } finally {
      setSavingSlug(null);
    }
  };

  const handleDeleteSurvey = async (slug: string, title: string) => {
    resetStatus();
    const confirmed = window.confirm(`确定删除问卷 “${title || slug}” 吗？该操作不可撤销。`);
    if (!confirmed) return;

    setDeletingSlug(slug);
    try {
      const response = await fetch(`/api/admin/surveys/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "删除失败");
      }
      showToast("已删除问卷");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "删除失败，请稍后再试");
    } finally {
      setDeletingSlug(null);
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
          <h2 className="text-2xl font-semibold text-foreground">新增问卷</h2>
          <span className="text-sm text-foreground-light">当前共 {totalCount} 份问卷</span>
        </div>
        <form className="grid gap-3" onSubmit={handleCreateSurvey}>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>slug</span>
              <input
                value={newSurvey.slug}
                onChange={(event) => handleNewSurveyChange("slug", event.target.value)}
                className="rounded-xl border border-primary/20 px-3 py-2"
                placeholder="例如：messages"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-foreground">
              <span>标题</span>
              <input
                value={newSurvey.title}
                onChange={(event) => handleNewSurveyChange("title", event.target.value)}
                className="rounded-xl border border-primary/20 px-3 py-2"
                placeholder="问卷标题"
                required
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>描述（可选）</span>
            <textarea
              value={newSurvey.description}
              onChange={(event) => handleNewSurveyChange("description", event.target.value)}
              className="rounded-xl border border-primary/20 px-3 py-2"
              rows={2}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>问卷链接（可选）</span>
            <input
              value={newSurvey.url}
              onChange={(event) => handleNewSurveyChange("url", event.target.value)}
              className="rounded-xl border border-primary/20 px-3 py-2"
              placeholder="https://..."
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            <span>嵌入代码（可选）</span>
            <textarea
              value={newSurvey.embedHtml}
              onChange={(event) => handleNewSurveyChange("embedHtml", event.target.value)}
              className="rounded-xl border border-primary/20 px-3 py-2 font-mono text-sm"
              rows={4}
              placeholder="粘贴第三方问卷平台提供的 iframe 代码"
            />
            <span className="text-xs text-foreground-light">
              可仅填写链接或嵌入代码之一，如两者均提供，详情页会优先使用嵌入代码。
            </span>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <AdminButton type="submit" disabled={creating} className="w-full md:w-auto">
            {creating ? "创建中..." : "创建问卷"}
          </AdminButton>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">问卷列表</h2>
        {loading ? (
          <div className="admin-panel text-center">
            正在加载问卷...
          </div>
        ) : surveys.length === 0 ? (
          <div className="admin-panel text-center">
            暂无问卷，请先新增。
          </div>
        ) : (
          <div className="grid gap-4">
            {editableSurveys.map((item, index) => {
              const surveyMeta = surveys.find((survey) => survey.slug === item.originalSlug);
              const isProcessing =
                savingSlug === item.originalSlug || deletingSlug === item.originalSlug;
              return (
                <div key={item.originalSlug} className="admin-panel space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{item.title || item.slug}</h3>
                      <p className="text-xs text-foreground-light mt-1">
                        最后更新：
                        {surveyMeta?.updatedAt
                          ? new Date(surveyMeta.updatedAt).toLocaleString()
                          : "--"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminButton
                        type="button"
                        tone="plain"
                        onClick={() => handleSaveSurvey(index)}
                        disabled={isProcessing || !isSurveyDirty(item)}
                      >
                        {savingSlug === item.originalSlug ? "保存中..." : "保存"}
                      </AdminButton>
                      <AdminButton
                        type="button"
                        tone="danger"
                        onClick={() => handleDeleteSurvey(item.originalSlug, item.title || item.slug)}
                        disabled={isProcessing}
                      >
                        {deletingSlug === item.originalSlug ? "删除中..." : "删除"}
                      </AdminButton>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-foreground">slug</span>
                      <input
                        value={item.slug}
                        onChange={(event) => handleEditableChange(index, "slug", event.target.value)}
                        className="rounded-xl border border-primary/20 px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-foreground">标题</span>
                      <input
                        value={item.title}
                        onChange={(event) => handleEditableChange(index, "title", event.target.value)}
                        className="rounded-xl border border-primary/20 px-3 py-2"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">描述（可选）</span>
                    <textarea
                      value={item.description}
                      onChange={(event) => handleEditableChange(index, "description", event.target.value)}
                      className="rounded-xl border border-primary/20 px-3 py-2"
                      rows={2}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">问卷链接（可选）</span>
                    <input
                      value={item.url}
                      onChange={(event) => handleEditableChange(index, "url", event.target.value)}
                      className="rounded-xl border border-primary/20 px-3 py-2"
                      placeholder="https://..."
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">嵌入代码（可选）</span>
                    <textarea
                      value={item.embedHtml}
                      onChange={(event) => handleEditableChange(index, "embedHtml", event.target.value)}
                      className="rounded-xl border border-primary/20 px-3 py-2 font-mono text-sm"
                      rows={4}
                    />
                  </label>
                  <p className="text-xs text-foreground-light">
                    可仅填写链接或嵌入代码之一；若两者都提供，前台详情页将优先展示嵌入代码。
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

