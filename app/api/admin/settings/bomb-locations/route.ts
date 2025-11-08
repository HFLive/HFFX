export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readBombLocations, writeBombLocations } from "@/lib/bomb-locations";

const updateSchema = z.object({
  locations: z.array(z.string()),
});

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const guard = adminGuard();
  if (guard) return guard;

  const bombLocations = await readBombLocations();
  return NextResponse.json(bombLocations);
}

export async function PATCH(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  await writeBombLocations(parsed.data.locations);
  return NextResponse.json({ locations: parsed.data.locations });
}

