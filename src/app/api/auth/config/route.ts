import { NextResponse } from "next/server";
import { getGoogleConfig } from "@/lib/google-oauth";

export async function GET() {
  const { enabled } = getGoogleConfig();
  return NextResponse.json({
    googleEnabled: enabled,
    appUrl:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.AGENTSHOW_URL ||
      null,
  });
}
