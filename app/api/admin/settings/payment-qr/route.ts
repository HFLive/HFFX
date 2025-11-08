export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readPaymentQr, writePaymentQr } from "@/lib/payment-qr";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "payment");

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

  const setting = await readPaymentQr();
  return NextResponse.json(setting);
}

export async function POST(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ message: "参数错误" }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return NextResponse.json({ message: "请上传图片文件" }, { status: 400 });
  }

  if (!fileEntry.type.startsWith("image/")) {
    return NextResponse.json({ message: "仅支持图片格式" }, { status: 400 });
  }

  if (fileEntry.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "文件大小不能超过 5MB" }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const extension = resolveFileExtension(fileEntry);
  const fileName = `payment-qr-${Date.now()}-${randomUUID()}${extension}`;
  const absolutePath = path.join(UPLOAD_DIR, fileName);
  const publicPath = `/uploads/payment/${fileName}`;

  const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
  await fs.writeFile(absolutePath, fileBuffer);

  const previous = await readPaymentQr();
  await writePaymentQr(publicPath);

  await cleanupPreviousFile(previous.path, publicPath);

  return NextResponse.json({ path: publicPath }, { status: 201 });
}

async function cleanupPreviousFile(previousPath: string, currentPath: string) {
  if (!previousPath || previousPath === currentPath) return;
  if (!previousPath.startsWith("/uploads/")) return;

  const normalized = path.normalize(previousPath);
  if (!normalized.startsWith("/uploads/")) return;

  const fullPath = path.join(process.cwd(), "public", normalized);
  try {
    await fs.unlink(fullPath);
  } catch (error: any) {
    // ignore cleanup errors
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


