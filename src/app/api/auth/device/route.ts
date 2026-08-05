import { NextResponse } from "next/server";
import { createDeviceCode } from "@/lib/cli-device-auth";

export async function POST() {
  const { userCode, deviceSecret, expiresIn } = await createDeviceCode();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AGENTCAST_URL ||
    "http://localhost:3000";

  return NextResponse.json({
    userCode,
    deviceSecret,
    expiresIn,
    verifyUrl: `${baseUrl.replace(/\/$/, "")}/cli/auth?code=${userCode}`,
  });
}
