import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildOrdersWorkbook, selectAndSortForGroup, type ExportOrderRow } from "./orderExport";
import { ITEM_LABELS } from "./constants";

function row(o: Partial<ExportOrderRow>): ExportOrderRow {
  return {
    firstName: "A", lastName: "Z", grade: "3", cheeseSlices: 0, pepperoniSlices: 1, wholeCheese: 0, wholePepperoni: 0,
    cheeseSlicesFromWhole: 0, pepperoniSlicesFromWhole: 0, shareNote: "", breadsticks: 0, snacks: 0, drinks: 0,
    parentName: "P", parentEmail: "p@x.com", parentPhone: "5175551212", ...o,
  };
}

async function load(rows: ExportOrderRow[]) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load((await buildOrdersWorkbook(rows, ITEM_LABELS, "3–5")) as unknown as ArrayBuffer);
  return wb.worksheets[0];
}

describe("buildOrdersWorkbook", () => {
  it("alternates rows: first data row unfilled, second light gray, and so on", async () => {
    const sheet = await load([row({ firstName: "Ann" }), row({ firstName: "Bo" }), row({ firstName: "Cy" }), row({ firstName: "Di" })]);
    const fills = [2, 3, 4, 5].map((r) => (sheet.getRow(r).getCell(1).fill as ExcelJS.FillPattern | undefined)?.fgColor?.argb ?? null);
    expect(fills).toEqual([null, "FFE9E9E9", null, "FFE9E9E9"]);
    // every cell in a shaded row is shaded, not just the first
    expect((sheet.getRow(3).getCell(16).fill as ExcelJS.FillPattern).fgColor?.argb).toBe("FFE9E9E9");
  });

  it("keeps the same columns, bold header, numeric counts, and text phone numbers", async () => {
    const sheet = await load([row({ firstName: "Ann", snacks: 2 })]);
    expect(sheet.getRow(1).getCell(1).value).toBe("First Name");
    expect(sheet.getRow(1).getCell(1).font?.bold).toBe(true);
    expect(sheet.getRow(1).getCell(16).value).toBe("Shared whole pizza split");
    expect(sheet.getRow(2).getCell(12).value).toBe(2);
    expect(sheet.getRow(2).getCell(6).value).toBe("5175551212");
  });

  it("is set up to print: landscape, one page wide, header repeated", async () => {
    const sheet = await load([row({})]);
    expect(sheet.pageSetup.orientation).toBe("landscape");
    expect(sheet.pageSetup.fitToWidth).toBe(1);
    expect(sheet.pageSetup.printTitlesRow).toBe("1:1");
  });
});

describe("selectAndSortForGroup", () => {
  it("still groups K–2 by grade then first name", () => {
    const out = selectAndSortForGroup([row({ grade: "2", firstName: "Zed" }), row({ grade: "K", firstName: "Yan" }), row({ grade: "K", firstName: "Abe" })], "k2");
    expect(out.map((r) => r.firstName)).toEqual(["Abe", "Yan", "Zed"]);
  });
});
