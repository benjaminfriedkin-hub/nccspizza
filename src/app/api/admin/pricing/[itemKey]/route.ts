import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setPriceSetting } from "@/lib/pricing";
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
  const { unitPriceCents, label } = body ?? {};

  if (unitPriceCents === undefined && label === undefined) {
    return NextResponse.json({ error: "Provide unitPriceCents and/or label to update." }, { status: 400 });
  }
  if (
    unitPriceCents !== undefined &&
    (typeof unitPriceCents !== "number" || !Number.isInteger(unitPriceCents) || unitPriceCents < 0)
  ) {
    return NextResponse.json({ error: "unitPriceCents must be a non-negative integer." }, { status: 400 });
  }
  if (label !== undefined && (typeof label !== "string" || !label.trim())) {
    return NextResponse.json({ error: "label must be a non-empty string." }, { status: 400 });
  }

  const updated = await setPriceSetting(itemKey as ItemKey, {
    unitPriceCents,
    label: label !== undefined ? label.trim() : undefined,
  });
  return NextResponse.json({ item: updated });
}
