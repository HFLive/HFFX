export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { readSurveys } from "@/lib/survey";

export async function GET() {
  const surveys = await readSurveys();
  return NextResponse.json(surveys);
}

