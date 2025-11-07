import crypto from "crypto";
import { cookies } from "next/headers";

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

export function createAdminSession() {
  const token = getExpectedHash();
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    // 只有在 HTTPS 下才设置 secure
    // 如果需要在 HTTP 下测试，可以设置环境变量 FORCE_HTTP=true
    secure: process.env.FORCE_HTTP === "true" ? false : process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 小时
  });
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
