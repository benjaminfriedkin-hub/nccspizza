import {
  gradeLabel,
  gradeRank,
  GRADE_BAND_K_TO_2,
  GRADE_BAND_3_TO_5,
  GRADE_BAND_6_TO_12,
  GRADE_BAND_TEACHERS_PARENTS,
  EXPORT_GROUPS,
  type ExportGroupKey,
} from "./constants";

export { EXPORT_GROUPS, type ExportGroupKey };
import type { LabelMap } from "./pricing";
import ExcelJS from "exceljs";

export interface ExportOrderRow {
  firstName: string;
  lastName: string;
  grade: string;
  cheeseSlices: number;
  pepperoniSlices: number;
  wholeCheese: number;
  wholePepperoni: number;
  cheeseSlicesFromWhole: number;
  pepperoniSlicesFromWhole: number;
  shareNote: string;
  breadsticks: number;
  snacks: number;
  drinks: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
}

/**
 * Rows for one export group, in the order they should appear in the CSV:
 * K–2 and 3–5 are grouped by grade (then first name within each grade);
 * 6–12 and Teachers+Parents are one combined list sorted by first name only.
 */
export function selectAndSortForGroup(rows: ExportOrderRow[], group: ExportGroupKey): ExportOrderRow[] {
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

const NUMERIC_COLUMNS_FROM = 6; // 0-based index of the first item-count column

export function buildOrdersTable(rows: ExportOrderRow[], labels: LabelMap): { header: string[]; body: (string | number)[][] } {
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
    "Whole cheese pizza slices for this person",
    "Whole pepperoni pizza slices for this person",
    "Shared whole pizza split",
  ];

  const body = rows.map((row) => [
    row.firstName,
    row.lastName,
    gradeLabel(row.grade),
    row.parentName,
    row.parentEmail,
    row.parentPhone ?? "",
    row.cheeseSlices,
    row.pepperoniSlices,
    row.wholeCheese,
    row.wholePepperoni,
    row.breadsticks,
    row.snacks,
    row.drinks,
    row.cheeseSlicesFromWhole,
    row.pepperoniSlicesFromWhole,
    row.shareNote,
  ]);

  return { header, body };
}

const GRAY_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9E9E9" } };
const THIN_LINE: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FFBFBFBF" } };

/** A print-ready worksheet: bold repeating header, rows alternating no fill / light gray. */
export async function buildOrdersWorkbook(
  rows: ExportOrderRow[],
  labels: LabelMap,
  sheetName: string
): Promise<Buffer> {
  const { header, body } = buildOrdersTable(rows, labels);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "1:1",
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });

  sheet.addRow(header);
  body.forEach((r) => sheet.addRow(r));

  sheet.columns.forEach((column, i) => {
    const longest = Math.max(header[i].length > 22 ? 12 : header[i].length, ...body.map((r) => String(r[i]).length));
    column.width = Math.min(Math.max(longest + 2, 6), i === header.length - 1 ? 46 : 28);
  });

  sheet.eachRow((row, rowNumber) => {
    const isHeader = rowNumber === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = { top: THIN_LINE, bottom: THIN_LINE, left: THIN_LINE, right: THIN_LINE };
      cell.alignment = {
        vertical: "middle",
        wrapText: isHeader || colNumber === header.length,
        horizontal: colNumber > NUMERIC_COLUMNS_FROM && colNumber < header.length ? "center" : "left",
      };
      if (isHeader) cell.font = { bold: true };
      // Data rows alternate: 1st no fill, 2nd gray, 3rd no fill...
      else if (rowNumber % 2 === 1) cell.fill = GRAY_FILL;
    });
  });
  sheet.getRow(1).height = 48;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
