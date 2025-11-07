import { NextResponse } from "next/server";
import { readDanmaku } from "@/lib/danmaku";

export async function GET() {
  const records = await readDanmaku();
  return NextResponse.json(records);
}

