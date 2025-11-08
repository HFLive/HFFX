import { prisma } from "./prisma";
import { unstable_noStore as noStore } from "next/cache";

export type BombLocationsSettings = {
  locations: string[];
};

const SETTING_KEY = "bomb_locations";

export async function readBombLocations(): Promise<BombLocationsSettings> {
  noStore();
  const setting = await prisma.siteSetting.findUnique({
    where: { key: SETTING_KEY },
  });

  if (setting && setting.value && setting.value.trim()) {
    try {
      const locations = JSON.parse(setting.value) as string[];
      if (Array.isArray(locations)) {
        return { locations };
      }
    } catch (error) {
      console.error("Failed to parse bomb locations:", error);
    }
  }

  return { locations: [] };
}

export async function writeBombLocations(locations: string[]): Promise<void> {
  noStore();
  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(locations) },
    create: { key: SETTING_KEY, value: JSON.stringify(locations) },
  });
}

