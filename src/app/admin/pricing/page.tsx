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

interface Draft {
  label: string;
  priceInput: string;
}

export default function PricingPage() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setDrafts(
          Object.fromEntries(
            (data.items || []).map((i: PriceItem) => [
              i.itemKey,
              { label: i.label, priceInput: (i.unitPriceCents / 100).toFixed(2) },
            ])
          )
        );
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function save(itemKey: string) {
    const draft = drafts[itemKey];
    const dollars = parseFloat(draft.priceInput);
    if (Number.isNaN(dollars) || dollars < 0) {
      setError("Price must be a non-negative number.");
      return;
    }
    if (!draft.label.trim()) {
      setError("Description can't be empty.");
      return;
    }
    setError(null);
    setSaving(itemKey);
    setSavedKey(null);
    const res = await fetch(`/api/admin/pricing/${itemKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitPriceCents: Math.round(dollars * 100), label: draft.label.trim() }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      return;
    }
    setSavedKey(itemKey);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-stone-900">Pricing</h1>
      <p className="text-sm text-stone-500">
        Prices and descriptions apply to new orders immediately. Past orders keep the price they were
        charged; descriptions are shown as they currently read, even on past orders.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <Card className="divide-y divide-stone-100 p-4 sm:p-5">
          {items.map((item) => (
            <div key={item.itemKey} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-stone-600">Description</label>
                <Input
                  value={drafts[item.itemKey]?.label ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [item.itemKey]: { ...d[item.itemKey], label: e.target.value } }))
                  }
                />
                {savedKey === item.itemKey && <p className="mt-1 text-xs text-green-600">Saved</p>}
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Price</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-stone-500">$</span>
                    <Input
                      className="w-24"
                      inputMode="decimal"
                      value={drafts[item.itemKey]?.priceInput ?? ""}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [item.itemKey]: { ...d[item.itemKey], priceInput: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
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
