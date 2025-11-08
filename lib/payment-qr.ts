import { prisma } from "./prisma";
import { unstable_noStore as noStore } from "next/cache";

export type PaymentQrSettings = {
  path: string;
};

const DEFAULT_QR_PATH = "/payment-qr.png";
const SETTING_KEY = "payment_qr_path";

export async function readPaymentQr(): Promise<PaymentQrSettings> {
  noStore();
  const setting = await prisma.siteSetting.findUnique({
    where: { key: SETTING_KEY },
  });

  if (setting && typeof setting.value === "string" && setting.value.trim()) {
    return { path: setting.value };
  }

  return { path: DEFAULT_QR_PATH };
}

export async function writePaymentQr(path: string): Promise<void> {
  noStore();
  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: path },
    create: { key: SETTING_KEY, value: path },
  });
}

export function getDefaultPaymentQrPath(): string {
  return DEFAULT_QR_PATH;
}


