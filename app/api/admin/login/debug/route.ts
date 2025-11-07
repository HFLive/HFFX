import { NextResponse } from "next/server";

// 调试端点 - 仅用于检查配置，不泄露敏感信息
export async function GET() {
  try {
    const hasPassword = !!process.env.ADMIN_PASSWORD;
    const nodeEnv = process.env.NODE_ENV || "development";
    
    return NextResponse.json({
      hasPassword,
      nodeEnv,
      passwordLength: process.env.ADMIN_PASSWORD?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message,
        hasPassword: false 
      },
      { status: 500 }
    );
  }
}

