import { NextResponse } from "next/server";
import { pollDeviceCode } from "@/lib/cli-device-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!secret) {
    return NextResponse.json({ error: "secret required" }, { status: 400 });
  }

  const result = await pollDeviceCode(secret);
  return NextResponse.json(result);
}
