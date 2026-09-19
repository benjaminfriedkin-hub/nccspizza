import {
  gradeLabel,
  gradeRank,
  GRADE_BAND_K_TO_2,
  GRADE_BAND_3_TO_5,
  GRADE_BAND_6_TO_12,
  GRADE_BAND_TEACHERS_PARENTS,
} from "./constants";
import type { LabelMap } from "./pricing";

export interface CsvOrderStudent {
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
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
}

export const EXPORT_GROUPS = [
  { key: "k2", label: "K–2" },
  { key: "3to5", label: "3–5" },
  { key: "6to12", label: "6–12" },
  { key: "teachersParents", label: "Teachers + Parents" },
] as const;

export type ExportGroupKey = (typeof EXPORT_GROUPS)[number]["key"];

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Rows for one export group, in the order they should appear in the CSV:
 * K–2 and 3–5 are grouped by grade (then first name within each grade);
 * 6–12 and Teachers+Parents are one combined list sorted by first name only.
 */
export function selectAndSortForGroup(rows: CsvOrderStudent[], group: ExportGroupKey): CsvOrderStudent[] {
  const bands: Record<ExportGroupKey, string[]> = {
    k2: GRADE_BAND_K_TO_2,
    "3to5": GRADE_BAND_3_TO_5,
    "6to12": GRADE_BAND_6_TO_12,
    teachersParents: GRADE_BAND_TEACHERS_PARENTS,
  };
  const groupByGrade = group === "k2" || group === "3to5";
  const band = bands[group];

  return rows
    .filter((r) => band.includes(r.grade))
    .sort((a, b) => {
      if (groupByGrade) {
        const gradeDiff = gradeRank(a.grade) - gradeRank(b.grade);
        if (gradeDiff !== 0) return gradeDiff;
      }
      return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
    });
}

export function buildOrdersCsv(rows: CsvOrderStudent[], labels: LabelMap): string {
  const header = [
    "First Name",
    "Last Name",
    "Grade",
    "Parent Name",
    "Parent Email",
    "Parent Phone",
    labels.cheeseSlice,
    labels.pepperoniSlice,
    labels.wholeCheese,
    labels.wholePepperoni,
    labels.breadsticks,
    labels.snack,
    labels.drink,
  ];

  const lines = [header.map(csvEscape).join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.firstName,
        row.lastName,
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
