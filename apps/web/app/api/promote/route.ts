import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  await prisma.user.update({
    where: { email: body.email },
    data: { role: "ADMIN" },
  });
  return NextResponse.json({ ok: true });
}
