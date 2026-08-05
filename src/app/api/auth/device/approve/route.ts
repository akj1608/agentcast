import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { approveDeviceCode } from "@/lib/cli-device-auth";

const schema = z.object({
  code: z.string().min(4).max(12),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = schema.parse(body);
    const result = await approveDeviceCode(code.toUpperCase(), user.id, user.apiToken);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to authorize" }, { status: 500 });
  }
}
