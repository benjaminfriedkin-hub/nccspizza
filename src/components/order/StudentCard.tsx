"use client";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { GRADE_OPTIONS, isSecondaryGrade } from "@/lib/constants";
import type { LabelMap, PriceMap, StudentForm } from "./shared";

interface StudentCardProps {
  index: number;
  student: StudentForm;
  prices: PriceMap;
  labels: LabelMap;
  canRemove: boolean;
  onChange: (student: StudentForm) => void;
  onRemove: () => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)} each`;
}

export function StudentCard({ index, student, prices, labels, canRemove, onChange, onRemove }: StudentCardProps) {
  function set<K extends keyof StudentForm>(key: K, value: StudentForm[K]) {
    onChange({ ...student, [key]: value });
  }

  function setGrade(grade: string) {
    // Drink is secondary-only — clear it if the newly selected grade can't have one,
    // so a stale quantity from a prior grade selection never gets silently submitted.
    onChange({ ...student, grade, drinks: isSecondaryGrade(grade) ? student.drinks : 0 });
  }

  const secondary = isSecondaryGrade(student.grade);

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700">Student {index + 1}</h3>
        {canRemove && (
          <Button variant="ghost" type="button" onClick={onRemove} className="!px-2 !py-1 text-xs">
            Remove
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">First name</label>
          <Input
            value={student.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            placeholder="e.g. Ava"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Last name</label>
          <Input
            value={student.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            placeholder="e.g. Johnson"
            autoComplete="off"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-stone-600">Grade</label>
          <select
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            value={student.grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          >
            <option value="" disabled>
              Select grade…
            </option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 divide-y divide-stone-100">
        <NumberStepper
          label={labels.cheeseSlice}
          priceLabel={formatPrice(prices.cheeseSlice)}
          value={student.cheeseSlices}
          onChange={(v) => set("cheeseSlices", v)}
        />
        <NumberStepper
          label={labels.pepperoniSlice}
          priceLabel={formatPrice(prices.pepperoniSlice)}
          value={student.pepperoniSlices}
          onChange={(v) => set("pepperoniSlices", v)}
        />
        <NumberStepper
          label={labels.wholeCheese}
          priceLabel={formatPrice(prices.wholeCheese)}
          value={student.wholeCheese}
          onChange={(v) => set("wholeCheese", v)}
        />
        <NumberStepper
          label={labels.wholePepperoni}
          priceLabel={formatPrice(prices.wholePepperoni)}
          value={student.wholePepperoni}
          onChange={(v) => set("wholePepperoni", v)}
        />
        <NumberStepper
          label={labels.breadsticks}
          priceLabel={formatPrice(prices.breadsticks)}
          value={student.breadsticks}
          onChange={(v) => set("breadsticks", v)}
        />
        <NumberStepper
          label={labels.snack}
          priceLabel={formatPrice(prices.snack)}
          value={student.snacks}
          onChange={(v) => set("snacks", v)}
        />
        {secondary && (
          <NumberStepper
            label={labels.drink}
            priceLabel={formatPrice(prices.drink)}
            value={student.drinks}
            onChange={(v) => set("drinks", v)}
          />
        )}
      </div>
      {!secondary && student.grade && (
        <p className="mt-2 text-xs text-stone-400">
          Drinks are available for secondary students (grades 6–12), teachers, and parents.
        </p>
      )}
    </Card>
  );
}
