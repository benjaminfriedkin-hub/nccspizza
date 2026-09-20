"use client";

import { useEffect, useMemo, useState } from "react";
import { listFridaysAround } from "@/lib/friday";
import { computePizzaNeeds } from "@/lib/pizzaMath";
import { gradeLabel, WEEKLY_BUFFER } from "@/lib/constants";
import { EXPORT_GROUPS } from "@/lib/csv";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface OrderStudent {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  cheeseSlices: number;
  pepperoniSlices: number;
  wholeCheese: number;
  wholePepperoni: number;
  breadsticks: number;
  snacks: number;
  drinks: number;
}

interface AdminOrder {
  id: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  totalAmountCents: number;
  paymentMode: string;
  paymentStatus: string;
  students: OrderStudent[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatFriday(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function DashboardPage() {
  const fridayOptions = useMemo(() => listFridaysAround(new Date(), 4, 8), []);
  const [selectedFriday, setSelectedFriday] = useState<Date>(() => listFridaysAround(new Date(), 0, 0)[0]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/orders?friday=${encodeURIComponent(selectedFriday.toISOString())}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setOrders(data.orders || []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFriday]);

  const allStudents = orders.flatMap((o) => o.students);
  const needs = computePizzaNeeds(allStudents, WEEKLY_BUFFER);
  const totalRevenueCents = orders.reduce((t, o) => t + o.totalAmountCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-stone-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
            value={selectedFriday.toISOString()}
            onChange={(e) => setSelectedFriday(new Date(e.target.value))}
          >
            {fridayOptions.map((d) => (
              <option key={d.toISOString()} value={d.toISOString()}>
                {formatFriday(d)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-stone-500">Export CSV:</span>
        {EXPORT_GROUPS.map((group) => (
          <a
            key={group.key}
            href={`/api/admin/orders/export?friday=${encodeURIComponent(selectedFriday.toISOString())}&group=${group.key}`}
            className="inline-flex"
          >
            <Button variant="secondary" type="button" className="!px-3 !py-1.5 text-xs">
              {group.label}
            </Button>
          </a>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-stone-700">🧀 Cheese pizzas needed</h2>
              <p className="mt-1 text-3xl font-bold text-amber-700">{needs.cheese.totalPizzasNeeded}</p>
              <p className="mt-1 text-xs text-stone-500">
                {needs.cheese.totalSlices} slices ordered → ⌈{needs.cheese.totalSlices}/8⌉ ={" "}
                {needs.cheese.pizzasFromSlices} pizza{needs.cheese.pizzasFromSlices === 1 ? "" : "s"}
                {needs.cheese.wholeOrdered > 0 && <> + {needs.cheese.wholeOrdered} whole ordered</>}
                {needs.cheese.buffer > 0 && <> + {needs.cheese.buffer} standing buffer</>}
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-stone-700">🍕 Pepperoni pizzas needed</h2>
              <p className="mt-1 text-3xl font-bold text-amber-700">{needs.pepperoni.totalPizzasNeeded}</p>
              <p className="mt-1 text-xs text-stone-500">
                {needs.pepperoni.totalSlices} slices ordered → ⌈{needs.pepperoni.totalSlices}/8⌉ ={" "}
                {needs.pepperoni.pizzasFromSlices} pizza{needs.pepperoni.pizzasFromSlices === 1 ? "" : "s"}
                {needs.pepperoni.wholeOrdered > 0 && <> + {needs.pepperoni.wholeOrdered} whole ordered</>}
                {needs.pepperoni.buffer > 0 && <> + {needs.pepperoni.buffer} standing buffer</>}
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-stone-700">🥖 Cottage Inn breadstick orders needed</h2>
              <p className="mt-1 text-3xl font-bold text-amber-700">
                {needs.breadsticks.totalPurchaseOrdersNeeded}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {needs.breadsticks.totalStudentOrders} parent order
                {needs.breadsticks.totalStudentOrders === 1 ? "" : "s"} (3 pieces each) → ⌈
                {needs.breadsticks.totalStudentOrders}/4⌉ = {needs.breadsticks.purchaseOrdersFromStudentOrders}{" "}
                Cottage Inn order{needs.breadsticks.purchaseOrdersFromStudentOrders === 1 ? "" : "s"} (12 pieces
                each)
                {needs.breadsticks.buffer > 0 && <> + {needs.breadsticks.buffer} standing buffer</>}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {orders.length} order{orders.length === 1 ? "" : "s"} · {formatCents(totalRevenueCents)}{" "}
                collected
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-stone-700">🍿 Snacks needed</h2>
              <p className="mt-1 text-3xl font-bold text-amber-700">{needs.snackOrders}</p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-stone-700">🥤 Drinks needed</h2>
              <p className="mt-1 text-3xl font-bold text-amber-700">{needs.drinkOrders}</p>
              <p className="mt-1 text-xs text-stone-500">Secondary students (6–12), teachers, and parents only</p>
            </Card>
          </div>

          <Card className="overflow-x-auto p-4 sm:p-5">
            <h2 className="mb-3 text-sm font-semibold text-stone-700">
              Full order list — {formatFriday(selectedFriday)}
            </h2>
            {orders.length === 0 ? (
              <p className="text-sm text-stone-500">No orders yet for this Friday.</p>
            ) : (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Grade</th>
                    <th className="py-2 pr-4">Items</th>
                    <th className="py-2 pr-4">Parent</th>
                    <th className="py-2 pr-4">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) =>
                    order.students.map((s, i) => (
                      <tr key={s.id} className="border-b border-stone-100 align-top">
                        <td className="py-2 pr-4 font-medium text-stone-800">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="py-2 pr-4 text-stone-600">{gradeLabel(s.grade)}</td>
                        <td className="py-2 pr-4 text-stone-600">
                          {[
                            s.cheeseSlices > 0 && `${s.cheeseSlices} cheese slice`,
                            s.pepperoniSlices > 0 && `${s.pepperoniSlices} pepperoni slice`,
                            s.wholeCheese > 0 && `${s.wholeCheese} whole cheese`,
                            s.wholePepperoni > 0 && `${s.wholePepperoni} whole pepperoni`,
                            s.breadsticks > 0 && `${s.breadsticks} breadsticks`,
                            s.snacks > 0 && `${s.snacks} snack`,
                            s.drinks > 0 && `${s.drinks} drink`,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </td>
                        {i === 0 && (
                          <td className="py-2 pr-4 text-stone-600" rowSpan={order.students.length}>
                            {order.parentName}
                            <br />
                            <span className="text-xs text-stone-400">
                              {order.parentEmail}
                              {order.parentPhone ? ` · ${order.parentPhone}` : ""}
                            </span>
                          </td>
                        )}
                        {i === 0 && (
                          <td className="py-2 pr-4 text-stone-600" rowSpan={order.students.length}>
                            {formatCents(order.totalAmountCents)}
                            <br />
                            <span className="text-xs text-stone-400">
                              {order.paymentMode === "mock" ? "test payment" : "Square"}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
