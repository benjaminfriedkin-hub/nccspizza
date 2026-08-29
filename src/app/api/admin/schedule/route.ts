import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFridayOfWeek } from "@/lib/friday";

export async function GET() {
  const skipped = await prisma.skippedFriday.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json({ skipped });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const dateInput = body?.date;
  if (!dateInput || Number.isNaN(new Date(dateInput).getTime())) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  // Normalize to the canonical Friday instant for that calendar week, so
  // lookups elsewhere (getUpcomingFriday, admin order list) match reliably.
  const friday = getFridayOfWeek(new Date(dateInput));

  const created = await prisma.skippedFriday.upsert({
    where: { date: friday },
    update: { reason: body?.reason || null },
    create: { date: friday, reason: body?.reason || null },
  });

  return NextResponse.json({ skipped: created }, { status: 201 });
}
