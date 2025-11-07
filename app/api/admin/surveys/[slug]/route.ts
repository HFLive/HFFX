import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const existingSurvey = await prisma.survey.findUnique({
    where: { slug: params.slug },
  });

  if (!existingSurvey) {
    return NextResponse.json({ message: "问卷不存在" }, { status: 404 });
  }

  const nextSlug = parsed.data.slug ?? existingSurvey.slug;
  if (nextSlug !== existingSurvey.slug) {
    const conflictSurvey = await prisma.survey.findUnique({
      where: { slug: nextSlug },
    });
    if (conflictSurvey) {
      return NextResponse.json({ message: "slug 已存在，请更换" }, { status: 409 });
    }
  }

  const urlValue = parsed.data.url === "" ? null : parsed.data.url;
  const embedValue = parsed.data.embedHtml === "" ? null : parsed.data.embedHtml;
  
  const finalUrl = urlValue !== undefined ? urlValue : existingSurvey.url;
  const finalEmbed = embedValue !== undefined ? embedValue : existingSurvey.embedHtml;
  
  if (!finalUrl && !finalEmbed) {
    return NextResponse.json({ message: "请至少保留链接或嵌入代码" }, { status: 400 });
  }

  const updatedSurvey = await prisma.survey.update({
    where: { slug: params.slug },
    data: {
      slug: nextSlug,
      title: parsed.data.title ?? existingSurvey.title,
      description: parsed.data.description !== undefined ? parsed.data.description : existingSurvey.description,
      url: finalUrl,
      embedHtml: finalEmbed,
    },
  });

  return NextResponse.json({
    id: updatedSurvey.id,
    slug: updatedSurvey.slug,
    title: updatedSurvey.title,
    description: updatedSurvey.description,
    url: updatedSurvey.url,
    embedHtml: updatedSurvey.embedHtml,
    createdAt: updatedSurvey.createdAt.toISOString(),
    updatedAt: updatedSurvey.updatedAt.toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const existingSurvey = await prisma.survey.findUnique({
    where: { slug: params.slug },
  });

  if (!existingSurvey) {
    return NextResponse.json({ message: "问卷不存在" }, { status: 404 });
  }

  await prisma.survey.delete({
    where: { slug: params.slug },
  });

  return NextResponse.json({ message: "已删除问卷" });
}

