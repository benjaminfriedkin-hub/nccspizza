import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrdersCsv, selectAndSortForGroup, EXPORT_GROUPS, type ExportGroupKey } from "@/lib/csv";

const GROUP_KEYS = EXPORT_GROUPS.map((g) => g.key);

function isExportGroupKey(value: string | null): value is ExportGroupKey {
  return value !== null && (GROUP_KEYS as string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const fridayParam = request.nextUrl.searchParams.get("friday");
  if (!fridayParam) {
    return NextResponse.json({ error: "Missing friday query param." }, { status: 400 });
  }
  const fridayDate = new Date(fridayParam);
  if (Number.isNaN(fridayDate.getTime())) {
    return NextResponse.json({ error: "Invalid friday date." }, { status: 400 });
  }

  const groupParam = request.nextUrl.searchParams.get("group");
  if (!isExportGroupKey(groupParam)) {
    return NextResponse.json(
      { error: `Missing or invalid group query param. Expected one of: ${GROUP_KEYS.join(", ")}.` },
      { status: 400 }
    );
  }

  const orders = await prisma.order.findMany({
    where: { fridayDate },
    include: { students: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = orders.flatMap((order) =>
    order.students.map((s) => ({
      firstName: s.firstName,
      lastName: s.lastName,
      grade: s.grade,
      cheeseSlices: s.cheeseSlices,
      pepperoniSlices: s.pepperoniSlices,
      wholeCheese: s.wholeCheese,
      wholePepperoni: s.wholePepperoni,
      breadsticks: s.breadsticks,
      snacks: s.snacks,
      drinks: s.drinks,
      parentName: order.parentName,
      parentEmail: order.parentEmail,
      parentPhone: order.parentPhone,
    }))
  );

  const grouped = selectAndSortForGroup(rows, groupParam);
  const csv = buildOrdersCsv(grouped);
  const dateLabel = fridayDate.toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="pizza-orders-${dateLabel}-${groupParam}.csv"`,
    },
  });
}
