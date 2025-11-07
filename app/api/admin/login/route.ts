import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, verifyAdminPassword } from "@/lib/auth";

const schema = z.object({
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误" }, { status: 400 });
  }

  const { password } = parsed.data;
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ message: "密码错误" }, { status: 401 });
  }

  createAdminSession();
  return NextResponse.json({ message: "登录成功" }, { status: 200 });
}
