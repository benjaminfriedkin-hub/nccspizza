"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StudentCard } from "./StudentCard";
import { OrderSummary } from "./OrderSummary";
import { SquareCardField, type SquareCardFieldHandle } from "./SquareCardField";
import { emptyStudent, studentTotalCents, type LabelMap, type PriceMap, type StudentForm } from "./shared";

const SQUARE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID);

function newKey() {
  return Math.random().toString(36).slice(2);
}

export function OrderForm({
  prices,
  labels,
  fridayLabel,
}: {
  prices: PriceMap;
  labels: LabelMap;
  fridayLabel: string;
}) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentForm[]>([emptyStudent(newKey())]);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const cardFieldRef = useRef<SquareCardFieldHandle>(null);

  const total = students.reduce((t, s) => t + studentTotalCents(s, prices), 0);

  function updateStudent(index: number, updated: StudentForm) {
    setStudents((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function removeStudent(index: number) {
    setStudents((prev) => prev.filter((_, i) => i !== index));
  }

  function addStudent() {
    setStudents((prev) => [...prev, emptyStudent(newKey())]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!parentName.trim() || !parentEmail.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    if (total === 0) {
      setError("Add at least one item to your order.");
      return;
    }
    if (students.some((s) => !s.grade)) {
      setError("Please select a grade for each student.");
      return;
    }

    setSubmitting(true);

    let sourceId: string | undefined;
    if (SQUARE_CONFIGURED) {
      const result = await cardFieldRef.current?.tokenize();
      if (!result?.token) {
        setError(result?.error || "Could not process card. Please check your card details.");
        setSubmitting(false);
        return;
      }
      sourceId = result.token;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName,
          parentEmail,
          parentPhone: parentPhone || undefined,
          sourceId,
          students: students.map((s) => ({
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
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/orders/${data.orderId}/confirmation`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-800">Students</h2>
          <Button variant="secondary" type="button" onClick={addStudent}>
            + Add another student
          </Button>
        </div>
        <div className="space-y-4">
          {students.map((s, i) => (
            <StudentCard
              key={s.key}
              index={i}
              student={s}
              prices={prices}
              labels={labels}
              canRemove={students.length > 1}
              onChange={(updated) => updateStudent(i, updated)}
              onRemove={() => removeStudent(i)}
            />
          ))}
        </div>
      </div>

      <OrderSummary students={students} prices={prices} labels={labels} />

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-stone-800">Your info</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Parent name</label>
            <Input value={parentName} onChange={(e) => setParentName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
            <Input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Phone (optional)</label>
            <Input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
          </div>
        </div>
      </Card>

      {SQUARE_CONFIGURED && (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-base font-semibold text-stone-800">Payment</h2>
          <SquareCardField ref={cardFieldRef} onReadyChange={setCardReady} />
        </Card>
      )}

      {!SQUARE_CONFIGURED && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Test mode: card payment isn&apos;t connected yet, so orders are placed without a real
          charge.
        </p>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Button
        type="submit"
        disabled={submitting || (SQUARE_CONFIGURED && !cardReady)}
        className="w-full text-base"
      >
        {submitting
          ? "Placing order…"
          : SQUARE_CONFIGURED
            ? `Pay $${(total / 100).toFixed(2)} & place order`
            : `Place order (test mode) — $${(total / 100).toFixed(2)}`}
      </Button>
      <p className="text-center text-xs text-stone-500">Pizza for {fridayLabel}</p>
    </form>
  );
}
