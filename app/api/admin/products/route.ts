import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const variantInputSchema = z.object({
  name: z.string().trim().min(1),
  price: z.string().trim().optional(),
  inventory: z.number().int().nonnegative().nullable().optional(),
});

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  coverImage: z.string().trim().min(1).optional(),
  variants: z.array(variantInputSchema).min(1),
});

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

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ message: "参数错误" }, { status: 400 });
  }

  const name = formData.get("name");
  const description = formData.get("description");
  const variantsRaw = formData.get("variants");
  const coverImageEntry = formData.get("coverImage");

  if (typeof name !== "string" || typeof variantsRaw !== "string") {
    return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
  }

  let variantsInput: unknown;
  try {
    variantsInput = JSON.parse(variantsRaw);
  } catch {
    return NextResponse.json({ message: "款式数据格式错误" }, { status: 400 });
  }

  const parsed = createProductSchema.safeParse({
    name,
    description: typeof description === "string" ? description : undefined,
    variants: variantsInput,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  let storedCoverImage: string | undefined;

  if (coverImageEntry instanceof File && coverImageEntry.size > 0) {
    if (!coverImageEntry.type.startsWith("image/")) {
      return NextResponse.json({ message: "仅支持上传图片文件" }, { status: 400 });
    }
    if (coverImageEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "图片大小不能超过 5MB" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const extension = resolveFileExtension(coverImageEntry);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    const fileBuffer = Buffer.from(await coverImageEntry.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);
    storedCoverImage = `/uploads/${fileName}`;
  } else if (typeof coverImageEntry === "string" && coverImageEntry.trim()) {
    storedCoverImage = coverImageEntry.trim();
  }

  const sanitized = {
    name: data.name.trim(),
    description: data.description?.trim() ? data.description.trim() : undefined,
    coverImage: storedCoverImage,
    variants: data.variants.map((variant) => ({
      name: variant.name.trim(),
      price: variant.price?.trim(),
      inventory: typeof variant.inventory === "number" ? variant.inventory : 0,
    })),
  };

  try {
    const product = await prisma.product.create({
      data: {
        name: sanitized.name,
        description: sanitized.description ?? null,
        coverImage: sanitized.coverImage ?? null,
        variants: {
          create: sanitized.variants.map((variant) => ({
            name: variant.name,
            price: parsePriceToCents(variant.price),
            inventory: variant.inventory ?? 0,
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "创建失败" }, { status: 400 });
  }
}

function resolveFileExtension(file: File) {
  const ext = path.extname(file.name);
  if (ext) return ext;
  switch (file.type) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".png";
  }
}

function parsePriceToCents(input?: string) {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "待定") return null;
  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    throw new Error("价格格式不正确");
  }
  return Math.round(value * 100);
}
