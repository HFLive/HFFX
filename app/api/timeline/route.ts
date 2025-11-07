import { NextResponse } from "next/server";
import { readTimeline } from "@/lib/timeline";

export async function GET() {
  const timeline = await readTimeline();
  return NextResponse.json(timeline);
}

