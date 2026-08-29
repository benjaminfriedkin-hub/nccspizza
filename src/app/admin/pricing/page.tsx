"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface PriceItem {
  itemKey: string;
  label: string;
  unitPriceCents: number;
}

export default function PricingPage() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setDrafts(
          Object.fromEntries((data.items || []).map((i: PriceItem) => [i.itemKey, (i.unitPriceCents / 100).toFixed(2)]))
        );
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function save(itemKey: string) {
    const dollars = parseFloat(drafts[itemKey]);
    if (Number.isNaN(dollars) || dollars < 0) return;
    setSaving(itemKey);
    setSavedKey(null);
    await fetch(`/api/admin/pricing/${itemKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitPriceCents: Math.round(dollars * 100) }),
    });
    setSaving(null);
    setSavedKey(itemKey);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-stone-900">Pricing</h1>
      <p className="text-sm text-stone-500">
        Prices apply to new orders immediately. Past orders keep the price they were charged.
      </p>

      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <Card className="divide-y divide-stone-100 p-4 sm:p-5">
          {items.map((item) => (
            <div key={item.itemKey} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-stone-800">{item.label}</p>
                {savedKey === item.itemKey && <p className="text-xs text-green-600">Saved</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-500">$</span>
                <Input
                  className="w-24"
                  inputMode="decimal"
                  value={drafts[item.itemKey] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [item.itemKey]: e.target.value }))}
                />
                <Button
                  variant="secondary"
                  onClick={() => save(item.itemKey)}
                  disabled={saving === item.itemKey}
                >
                  {saving === item.itemKey ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
