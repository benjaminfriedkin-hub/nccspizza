import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUsingMockTransport } from "@/lib/email";

export async function GET() {
  const usingMockTransport = isUsingMockTransport();
  const messages = usingMockTransport
    ? await prisma.mockEmail.findMany({ orderBy: { sentAt: "desc" }, take: 50 })
    : [];
  return NextResponse.json({ usingMockTransport, messages });
}
