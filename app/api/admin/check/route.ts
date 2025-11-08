export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";

export async function GET() {
  const isAdmin = isAdminRequest();
  return NextResponse.json({ isAdmin });
}

