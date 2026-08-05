import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  setAuthCookie,
  getInitials,
} from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(2).max(50),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await db.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        passwordHash: await hashPassword(data.password),
        avatar: getInitials(data.displayName),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        apiToken: true,
      },
    });

    await setAuthCookie(user.id);

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
