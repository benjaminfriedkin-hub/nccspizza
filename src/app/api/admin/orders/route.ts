import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const fridayParam = request.nextUrl.searchParams.get("friday");
  if (!fridayParam) {
    return NextResponse.json({ error: "Missing friday query param." }, { status: 400 });
  }
  const fridayDate = new Date(fridayParam);
  if (Number.isNaN(fridayDate.getTime())) {
    return NextResponse.json({ error: "Invalid friday date." }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { fridayDate },
    include: { students: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ orders });
}
