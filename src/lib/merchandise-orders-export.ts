import "server-only";

import ExcelJS from "exceljs";
import {
  merchandiseOrderItemSummary,
  type MerchandiseOrderRecord,
} from "@/lib/merchandise-order-response-config";

export function merchandiseOrdersExportFilename(now = new Date()) {
  return `jackals-vc-merchandise-orders-${now.toISOString().slice(0, 10)}.xlsx`;
}

export async function buildMerchandiseOrdersWorkbook(
  orders: MerchandiseOrderRecord[],
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jackals VC";
  const sheet = workbook.addWorksheet("Merchandise orders", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { key: "submitted", header: "Submitted", width: 20 },
    { key: "lastName", header: "Last name", width: 20 },
    { key: "firstName", header: "First name", width: 18 },
    { key: "email", header: "Email", width: 28 },
    { key: "phone", header: "Phone", width: 18 },
    { key: "fit", header: "Fit", width: 12 },
    { key: "items", header: "Items", width: 60 },
    { key: "status", header: "Payment", width: 18 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFB91C1C" },
  };

  for (const order of orders) {
    sheet.addRow({
      submitted: new Date(order.createdAt).toLocaleString("en-IE"),
      lastName: order.lastName,
      firstName: order.firstName,
      email: order.email,
      phone: order.phoneNumber,
      fit: order.genderLabel,
      items: merchandiseOrderItemSummary(order).join(", "),
      status: order.paymentStatus,
    });
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, orders.length + 1), column: 8 },
  };

  const summary = workbook.addWorksheet("Summary");
  summary.addRow(["Jackals VC — Merchandise orders"]);
  summary.getRow(1).font = { bold: true, size: 14 };
  summary.addRow(["Total orders", orders.length]);
  for (const [label, field] of [
    ["Training t-shirt", "trainingTshirt"],
    ["Quarter zip", "trainingTop"],
    ["Zip hoodie", "jacketHoodie"],
    ["High collar zip", "jacketHighCollar"],
    ["Full zip", "jacketFullZip"],
  ] as const) {
    summary.addRow([label, orders.filter((order) => order[field]).length]);
  }

  return workbook.xlsx.writeBuffer();
}
