"use client";

import { useEffect, useMemo, useState } from "react";
import { listFridaysAround } from "@/lib/friday";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface SkippedFriday {
  id: string;
  date: string;
  reason: string | null;
}

function formatFriday(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function SchedulePage() {
  const upcomingFridays = useMemo(() => listFridaysAround(new Date(), 0, 12), []);
  const [skipped, setSkipped] = useState<SkippedFriday[]>([]);
  const [selectedFriday, setSelectedFriday] = useState(upcomingFridays[0].toISOString());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/admin/schedule")
      .then((r) => r.json())
      .then((data) => {
        setSkipped(data.skipped || []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function addSkip(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedFriday, reason: reason || undefined }),
    });
    setReason("");
    setSubmitting(false);
    load();
  }

  async function removeSkip(id: string) {
    await fetch(`/api/admin/schedule/${id}`, { method: "DELETE" });
    load();
  }

  const skippedIsoSet = new Set(skipped.map((s) => new Date(s.date).toISOString()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Friday schedule</h1>
        <p className="text-sm text-stone-500">
          Every Friday is a pizza day by default. Mark specific Fridays as skipped for holidays or breaks.
        </p>
      </div>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-stone-700">Mark a Friday skipped</h2>
        <form onSubmit={addSkip} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Friday</label>
            <select
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
              value={selectedFriday}
              onChange={(e) => setSelectedFriday(e.target.value)}
            >
              {upcomingFridays.map((d) => {
                const iso = d.toISOString();
                return (
                  <option key={iso} value={iso} disabled={skippedIsoSet.has(iso)}>
                    {formatFriday(d)} {skippedIsoSet.has(iso) ? "(already skipped)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-stone-600">Reason (optional)</label>
            <Input
              placeholder="e.g. Winter break"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Mark skipped"}
          </Button>
        </form>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-stone-700">Skipped Fridays</h2>
        {loading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : skipped.length === 0 ? (
          <p className="text-sm text-stone-500">No Fridays are currently marked skipped.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {skipped.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-stone-800">{formatFriday(new Date(s.date))}</p>
                  {s.reason && <p className="text-xs text-stone-500">{s.reason}</p>}
                </div>
                <Button variant="ghost" onClick={() => removeSkip(s.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
