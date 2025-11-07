import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readSurveys, writeSurveys } from "@/lib/survey";

const slugRegex = /^[a-z0-9-]+$/;

const updateSchema = z
  .object({
    slug: z.string().min(1).max(64).regex(slugRegex, "slug 只能包含字母、数字和短横线").optional(),
    title: z.string().min(1).max(120).optional(),
    description: z.string().optional(),
    url: z.string().url().optional().or(z.literal("")).optional(),
    embedHtml: z.string().optional().or(z.literal("")).optional(),
  })
  .refine((data) => {
    const url = typeof data.url === "string" ? data.url : undefined;
    const embed = typeof data.embedHtml === "string" ? data.embedHtml : undefined;
    if (url === "" && embed === "") {
      return false;
    }
    return true;
  }, { message: "请至少保留链接或嵌入代码", path: ["url"] });

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

function normalizeUpdate(payload: any) {
  const toTrimmed = (value: any) => (typeof value === "string" ? value.trim() : undefined);
  const slug = toTrimmed(payload?.slug)?.toLowerCase();
  const title = toTrimmed(payload?.title);
  const description = toTrimmed(payload?.description);
  const url = toTrimmed(payload?.url);
  const embedHtml = toTrimmed(payload?.embedHtml);
  return {
    slug: slug && slug.length > 0 ? slug : undefined,
    title: title && title.length > 0 ? title : undefined,
    description: description && description.length > 0 ? description : undefined,
    url: url ?? undefined,
    embedHtml: embedHtml ?? undefined,
  };
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "请求格式错误" }, { status: 400 });
  }

  const normalized = normalizeUpdate(body);
  const parsed = updateSchema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const surveys = await readSurveys();
  const index = surveys.findIndex((item) => item.slug === params.slug);
  if (index === -1) {
    return NextResponse.json({ message: "问卷不存在" }, { status: 404 });
  }

  const target = surveys[index];
  const nextSlug = parsed.data.slug ?? target.slug;
  if (nextSlug !== target.slug && surveys.some((item, idx) => idx !== index && item.slug === nextSlug)) {
    return NextResponse.json({ message: "slug 已存在，请更换" }, { status: 409 });
  }

  const urlValue = parsed.data.url === "" ? undefined : parsed.data.url;
  const embedValue = parsed.data.embedHtml === "" ? undefined : parsed.data.embedHtml;
  if (!urlValue && !embedValue) {
    return NextResponse.json({ message: "请至少保留链接或嵌入代码" }, { status: 400 });
  }

  const updated = {
    ...target,
    slug: nextSlug,
    title: parsed.data.title ?? target.title,
    description: parsed.data.description ?? target.description,
    url: urlValue ?? target.url,
    embedHtml: embedValue ?? target.embedHtml,
    updatedAt: new Date().toISOString(),
  };

  surveys.splice(index, 1, updated);
  await writeSurveys(surveys);

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const surveys = await readSurveys();
  const index = surveys.findIndex((item) => item.slug === params.slug);
  if (index === -1) {
    return NextResponse.json({ message: "问卷不存在" }, { status: 404 });
  }

  surveys.splice(index, 1);
  await writeSurveys(surveys);

  return NextResponse.json({ message: "已删除问卷" });
}

