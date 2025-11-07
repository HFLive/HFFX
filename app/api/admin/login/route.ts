import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession, verifyAdminPassword } from "@/lib/auth";

const schema = z.object({
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "参数错误" }, { status: 400 });
    }

    const { password } = parsed.data;
    
    // 验证密码
    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ message: "密码错误" }, { status: 401 });
    }

    // 创建会话并返回响应
    const response = NextResponse.json({ 
      message: "登录成功",
      success: true 
    }, { status: 200 });
    
    // 设置 cookie
    createAdminSession(response);
    
    return response;
  } catch (error: any) {
    console.error("登录错误:", error);
    return NextResponse.json({ 
      message: error.message || "登录失败，请检查配置" 
    }, { status: 500 });
  }
}
