import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readSurveys, writeSurveys, SurveyRecord } from "@/lib/survey";

const slugRegex = /^[a-z0-9-]+$/;

const surveyInputSchema = z
  .object({
    slug: z.string().min(1).max(64).regex(slugRegex, "slug 只能包含字母、数字和短横线"),
    title: z.string().min(1).max(120),
    description: z.string().optional(),
    url: z.string().url().optional(),
    embedHtml: z.string().optional(),
  })
  .refine((data) => Boolean(data.url || data.embedHtml), {
    message: "请至少填写链接或嵌入代码",
    path: ["url"],
  });

function normalizeInput(payload: any) {
  const toTrimmed = (value: any) => (typeof value === "string" ? value.trim() : undefined);
  const slug = toTrimmed(payload?.slug)?.toLowerCase() ?? "";
  const title = toTrimmed(payload?.title) ?? "";
  const description = toTrimmed(payload?.description);
  const urlRaw = toTrimmed(payload?.url);
  const embedHtmlRaw = toTrimmed(payload?.embedHtml);
  return {
    slug,
    title,
    description: description && description.length > 0 ? description : undefined,
    url: urlRaw && urlRaw.length > 0 ? urlRaw : undefined,
    embedHtml: embedHtmlRaw && embedHtmlRaw.length > 0 ? embedHtmlRaw : undefined,
  };
}

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const guard = adminGuard();
  if (guard) return guard;

  const surveys = await readSurveys();
  return NextResponse.json(surveys);
}

export async function POST(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "请求格式错误" }, { status: 400 });
  }

  const normalized = normalizeInput(body);
  const parsed = surveyInputSchema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const surveys = await readSurveys();
  if (surveys.some((item) => item.slug === parsed.data.slug)) {
    return NextResponse.json({ message: "slug 已存在，请更换" }, { status: 409 });
  }

  const timestamp = new Date().toISOString();
  const newRecord: SurveyRecord = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description,
    url: parsed.data.url,
    embedHtml: parsed.data.embedHtml,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await writeSurveys([...surveys, newRecord]);
  return NextResponse.json(newRecord, { status: 201 });
}

