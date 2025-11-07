import { NextResponse } from "next/server";
import { readCountdown } from "@/lib/countdown";

export async function GET() {
  const countdown = await readCountdown();
  return NextResponse.json(countdown);
}

