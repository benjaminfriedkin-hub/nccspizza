import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setPrice } from "@/lib/pricing";
import { ITEM_KEYS, type ItemKey } from "@/lib/constants";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemKey: string }> }
) {
  const { itemKey } = await params;
  if (!ITEM_KEYS.includes(itemKey as ItemKey)) {
    return NextResponse.json({ error: "Unknown item." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const unitPriceCents = body?.unitPriceCents;
  if (typeof unitPriceCents !== "number" || !Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    return NextResponse.json({ error: "unitPriceCents must be a non-negative integer." }, { status: 400 });
  }

  const updated = await setPrice(itemKey as ItemKey, unitPriceCents);
  return NextResponse.json({ item: updated });
}
