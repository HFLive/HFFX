import { prisma } from "./prisma";
import { unstable_noStore as noStore } from 'next/cache';

export type CountdownSettings = {
  target: string;
};

const FALLBACK_TARGET = "2025-12-30T18:00:00";

export async function readCountdown(): Promise<CountdownSettings> {
  noStore();
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "countdown_target" },
  });

  if (setting && setting.value && setting.value.trim()) {
    return { target: setting.value };
  }

  return { target: FALLBACK_TARGET };
}

export async function writeCountdown(settings: CountdownSettings): Promise<void> {
  noStore();
  await prisma.siteSetting.upsert({
    where: { key: "countdown_target" },
    update: { value: settings.target },
    create: { key: "countdown_target", value: settings.target },
  });
}

