import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "hffx-secret";
const COOKIE_NAME = "hf_admin_auth";

function getExpectedHash() {
  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD 未设置，请在环境变量中配置");
  }
  return crypto.createHash("sha256").update(`${ADMIN_PASSWORD}:${ADMIN_SECRET}`).digest("hex");
}

export function verifyAdminPassword(password: string) {
  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD 未设置，请在环境变量中配置");
  }
  return password === ADMIN_PASSWORD;
}

// 支持传入 NextResponse 对象来设置 cookie
export function createAdminSession(response?: NextResponse) {
  const token = getExpectedHash();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12, // 12 小时
  };

  if (response) {
    // 如果提供了 response 对象，直接在响应上设置 cookie
    response.cookies.set(COOKIE_NAME, token, cookieOptions);
  } else {
    // 否则使用 cookies() API
    cookies().set(COOKIE_NAME, token, cookieOptions);
  }
}

export function destroyAdminSession() {
  cookies().delete(COOKIE_NAME);
}

export function isAdminRequest(): boolean {
  try {
    const token = cookies().get(COOKIE_NAME)?.value;
    if (!token) return false;
    return token === getExpectedHash();
  } catch (error) {
    return false;
  }
}

export function requireAdmin() {
  if (!isAdminRequest()) {
    const err = new Error("需要管理员权限");
    // @ts-expect-error 自定义属性
    err.statusCode = 401;
    throw err;
  }
}
