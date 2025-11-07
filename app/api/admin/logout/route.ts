import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth";

export async function POST() {
  destroyAdminSession();
  return NextResponse.json({ message: "已退出登录" });
}
