import "server-only";

import ExcelJS from "exceljs";
import { type KitOrderRecord } from "@/lib/kit-order-response-config";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFB91C1C" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  name: "Calibri",
  size: 11,
};

const ZEBRA_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF8FAFC" },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function kitOrdersExportFilename(now = new Date()) {
  return `jackals-vc-kit-orders-${now.toISOString().slice(0, 10)}.xlsx`;
}

export async function buildKitOrdersWorkbook(orders: KitOrderRecord[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jackals VC";
  workbook.created = new Date();
  workbook.modified = new Date();

  const columns = [
    { key: "submittedAt", header: "Submitted", width: 20 },
    { key: "lastName", header: "Last name (jersey)", width: 22 },
    { key: "firstName", header: "First name", width: 18 },
    { key: "email", header: "Email", width: 28 },
    { key: "phoneNumber", header: "Phone", width: 18 },
    { key: "gender", header: "Fit", width: 12 },
    { key: "kitPieces", header: "Kit pieces", width: 36 },
    { key: "jerseySize", header: "Jersey size", width: 12 },
    { key: "shortsSize", header: "Shorts size", width: 12 },
    { key: "kitNumber1", header: "Kit #1", width: 10 },
    { key: "kitNumber2", header: "Kit #2", width: 10 },
    { key: "trainingTshirtSize", header: "T-shirt size", width: 14 },
    { key: "trainingTopSize", header: "Quarter zip size", width: 16 },
    { key: "jacketHoodieSize", header: "Zip hoodie size", width: 16 },
    { key: "jacketHighCollarSize", header: "High collar size", width: 16 },
    { key: "jacketFullZipSize", header: "Full zip size", width: 16 },
  ];

  const sheet = workbook.addWorksheet("Kit orders", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  sheet.columns = columns.map((column) => ({
    key: column.key,
    header: column.header,
    width: column.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF7F1D1D" } },
    };
  });

  const rows = orders.map((order) => ({
    submittedAt: formatDateTime(order.createdAt),
    lastName: order.lastName.toUpperCase(),
    firstName: order.firstName,
    email: order.email,
    phoneNumber: order.phoneNumber,
    gender: order.genderLabel,
    kitPieces: order.kitPiecesLabel,
    jerseySize: order.playerJersey || order.liberoJersey ? order.jerseySize : "",
    shortsSize: order.playerShorts || order.liberoShorts ? order.shortsSize : "",
    kitNumber1: order.preferredKitNumber1,
    kitNumber2: order.preferredKitNumber2,
    trainingTshirtSize: order.trainingTshirt ? order.trainingTshirtSize : "",
    trainingTopSize: order.trainingTop ? order.trainingTopSize : "",
    jacketHoodieSize: order.jacketHoodie ? order.jacketHoodieSize : "",
    jacketHighCollarSize: order.jacketHighCollar
      ? order.jacketHighCollarSize
      : "",
    jacketFullZipSize: order.jacketFullZip ? order.jacketFullZipSize : "",
  }));

  for (const [index, row] of rows.entries()) {
    const excelRow = sheet.addRow(row);
    excelRow.alignment = { vertical: "middle" };
    if (index % 2 === 1) {
      excelRow.eachCell((cell) => {
        cell.fill = ZEBRA_FILL;
      });
    }
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, rows.length + 1), column: columns.length },
  };

  const summary = workbook.addWorksheet("Summary");
  summary.getColumn(1).width = 32;
  summary.getColumn(2).width = 14;
  summary.addRow(["Jackals VC — Kit orders"]);
  summary.getRow(1).font = { bold: true, size: 14, color: { argb: "FFB91C1C" } };
  summary.addRow(["Exported", new Date().toLocaleString("en-IE")]);
  summary.addRow(["Total orders", orders.length]);
  summary.addRow([]);

  const addCountBlock = (title: string, counts: Map<string, number>) => {
    summary.addRow([title, "Count"]).font = { bold: true };
    for (const [label, count] of counts) {
      summary.addRow([label, count]);
    }
    summary.addRow([]);
  };

  const byGender = new Map<string, number>();
  const byPieces = new Map<string, number>();
  let playerJerseys = 0;
  let playerShorts = 0;
  let liberoJerseys = 0;
  let liberoShorts = 0;
  let trainingTshirts = 0;
  let trainingTops = 0;
  let hoodies = 0;
  let highCollars = 0;
  let fullZips = 0;

  for (const order of orders) {
    byGender.set(
      order.genderLabel,
      (byGender.get(order.genderLabel) ?? 0) + 1,
    );
    const pieces = order.kitPiecesLabel || "No kit pieces";
    byPieces.set(pieces, (byPieces.get(pieces) ?? 0) + 1);
    if (order.playerJersey) playerJerseys += 1;
    if (order.playerShorts) playerShorts += 1;
    if (order.liberoJersey) liberoJerseys += 1;
    if (order.liberoShorts) liberoShorts += 1;
    if (order.trainingTshirt) trainingTshirts += 1;
    if (order.trainingTop) trainingTops += 1;
    if (order.jacketHoodie) hoodies += 1;
    if (order.jacketHighCollar) highCollars += 1;
    if (order.jacketFullZip) fullZips += 1;
  }

  addCountBlock("By fit", byGender);
  addCountBlock("By kit pieces", byPieces);
  summary.addRow(["Kit pieces", "Count"]).font = { bold: true };
  summary.addRow(["Player jersey", playerJerseys]);
  summary.addRow(["Player shorts", playerShorts]);
  summary.addRow(["Libero jersey", liberoJerseys]);
  summary.addRow(["Libero shorts", liberoShorts]);
  summary.addRow([]);
  summary.addRow(["Extras", "Count"]).font = { bold: true };
  summary.addRow(["Training t-shirt", trainingTshirts]);
  summary.addRow(["Quarter zip", trainingTops]);
  summary.addRow(["Zip hoodie", hoodies]);
  summary.addRow(["High collar zip", highCollars]);
  summary.addRow(["Full zip", fullZips]);

  return workbook.xlsx.writeBuffer();
}
