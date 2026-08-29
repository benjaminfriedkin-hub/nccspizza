import { ITEM_LABELS, gradeLabel } from "./constants";

interface CsvOrderStudent {
  studentName: string;
  grade: string;
  cheeseSlices: number;
  pepperoniSlices: number;
  wholeCheese: number;
  wholePepperoni: number;
  breadsticks: number;
  snacks: number;
  drinks: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildOrdersCsv(rows: CsvOrderStudent[]): string {
  const header = [
    "Student Name",
    "Grade",
    "Parent Name",
    "Parent Email",
    "Parent Phone",
    ITEM_LABELS.cheeseSlice,
    ITEM_LABELS.pepperoniSlice,
    ITEM_LABELS.wholeCheese,
    ITEM_LABELS.wholePepperoni,
    ITEM_LABELS.breadsticks,
    ITEM_LABELS.snack,
    ITEM_LABELS.drink,
  ];

  const lines = [header.map(csvEscape).join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.studentName,
        gradeLabel(row.grade),
        row.parentName,
        row.parentEmail,
        row.parentPhone ?? "",
        String(row.cheeseSlices),
        String(row.pepperoniSlices),
        String(row.wholeCheese),
        String(row.wholePepperoni),
        String(row.breadsticks),
        String(row.snacks),
        String(row.drinks),
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  return lines.join("\n");
}
