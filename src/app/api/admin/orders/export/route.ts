import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrdersWorkbook, selectAndSortForGroup, EXPORT_GROUPS, type ExportGroupKey } from "@/lib/orderExport";
import { getCurrentPriceSettings } from "@/lib/pricing";
import { shareNotes } from "@/lib/wholePizza";

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

  const rows = orders.flatMap((order) => {
    const notes = shareNotes(order.students.map((s) => ({ ...s, name: `${s.firstName} ${s.lastName}` })));
    return order.students.map((s, i) => ({
      shareNote: notes[i],
      cheeseSlicesFromWhole: s.cheeseSlicesFromWhole,
      pepperoniSlicesFromWhole: s.pepperoniSlicesFromWhole,
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
    }));
  });

  const { label: labels } = await getCurrentPriceSettings();
  const grouped = selectAndSortForGroup(rows, groupParam);
  const groupLabel = EXPORT_GROUPS.find((g) => g.key === groupParam)!.label;
  const workbook = await buildOrdersWorkbook(grouped, labels, groupLabel);
  const dateLabel = fridayDate.toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(workbook), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="pizza-orders-${dateLabel}-${groupParam}.xlsx"`,
    },
  });
}
