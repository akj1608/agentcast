import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, setAuthCookie, serializeAuthUser } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await db.user.findUnique({ where: { email: data.email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials. Try signing in with Google." },
        { status: 401 }
      );
    }
    if (!(await verifyPassword(data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setAuthCookie(user.id);

    return NextResponse.json({
      user: serializeAuthUser({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        apiToken: user.apiToken,
      }),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
