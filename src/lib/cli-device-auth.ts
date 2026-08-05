import { customAlphabet } from "nanoid";
import { db } from "./db";

const userCodeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
const secretAlphabet = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 32);

const DEVICE_TTL_MS = 10 * 60 * 1000;

export async function createDeviceCode() {
  await db.cliDeviceCode.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const userCode = userCodeAlphabet();
  const deviceSecret = secretAlphabet();
  const expiresAt = new Date(Date.now() + DEVICE_TTL_MS);

  await db.cliDeviceCode.create({
    data: { userCode, deviceSecret, expiresAt },
  });

  return { userCode, deviceSecret, expiresAt, expiresIn: DEVICE_TTL_MS / 1000 };
}

export async function approveDeviceCode(userCode: string, userId: string, apiToken: string) {
  const record = await db.cliDeviceCode.findUnique({ where: { userCode } });
  if (!record || record.expiresAt < new Date()) {
    return { error: "Code expired or invalid", status: 400 as const };
  }
  if (record.userId) {
    return { error: "Code already used", status: 400 as const };
  }

  await db.cliDeviceCode.update({
    where: { id: record.id },
    data: { userId, apiToken },
  });

  return { ok: true as const };
}

export async function pollDeviceCode(deviceSecret: string) {
  const record = await db.cliDeviceCode.findUnique({ where: { deviceSecret } });
  if (!record) return { status: "invalid" as const };
  if (record.expiresAt < new Date()) return { status: "expired" as const };
  if (!record.apiToken || !record.userId) return { status: "pending" as const };

  const user = await db.user.findUnique({
    where: { id: record.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      apiToken: true,
    },
  });

  if (!user) return { status: "invalid" as const };

  await db.cliDeviceCode.delete({ where: { id: record.id } });

  return {
    status: "approved" as const,
    apiToken: user.apiToken,
    user: {
      email: user.email,
      username: user.username,
      displayName: user.displayName,
    },
  };
}
