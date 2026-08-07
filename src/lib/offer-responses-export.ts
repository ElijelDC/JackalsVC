import "server-only";

import ExcelJS from "exceljs";
import type { ClubOfferResponseRecord } from "@/lib/club-offer-response-config";
import type { CoachOfferResponseRecord } from "@/lib/coach-offer-response-config";
import { coachPoloMaterialLabel } from "@/lib/coach-offer-config";

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

function statusLabel(status: string) {
  if (status === "ACCEPTED") return "Accepted";
  if (status === "DECLINED") return "Declined";
  return status;
}

async function writeWorkbook(
  sheetName: string,
  title: string,
  columns: Array<{ key: string; header: string; width: number }>,
  rows: Record<string, string | number>[],
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jackals VC";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
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
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 14;
  summary.addRow([title]);
  summary.getRow(1).font = { bold: true, size: 14, color: { argb: "FFB91C1C" } };
  summary.addRow(["Exported", new Date().toLocaleString("en-IE")]);
  summary.addRow(["Total rows", rows.length]);
  summary.addRow([]);
  summary.addRow(["By status", "Count"]).font = { bold: true };

  const byStatus = new Map<string, number>();
  const byTeam = new Map<string, number>();
  for (const row of rows) {
    const status = String(row.status ?? "");
    const team = String(row.team ?? "");
    byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
    byTeam.set(team, (byTeam.get(team) ?? 0) + 1);
  }
  for (const [status, count] of byStatus) {
    summary.addRow([status, count]);
  }
  summary.addRow([]);
  summary.addRow(["By team", "Count"]).font = { bold: true };
  for (const [team, count] of byTeam) {
    summary.addRow([team, count]);
  }

  return workbook.xlsx.writeBuffer();
}

export async function buildClubOfferResponsesWorkbook(
  responses: ClubOfferResponseRecord[],
) {
  const columns = [
    { key: "submittedAt", header: "Submitted", width: 20 },
    { key: "status", header: "Status", width: 12 },
    { key: "team", header: "Team", width: 18 },
    { key: "fullName", header: "Full name", width: 24 },
    { key: "email", header: "Email", width: 28 },
    { key: "phoneNumber", header: "Phone", width: 16 },
    { key: "kitNumber1", header: "Kit #1", width: 10 },
    { key: "kitNumber2", header: "Kit #2", width: 10 },
    { key: "signed", header: "Signed", width: 10 },
  ];

  const rows = responses.map((row) => ({
    submittedAt: formatDateTime(row.createdAt),
    status: statusLabel(row.status),
    team: row.teamLabel,
    fullName: row.fullName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    kitNumber1:
      row.status === "ACCEPTED" && row.preferredKitNumber1 != null
        ? row.preferredKitNumber1
        : "",
    kitNumber2:
      row.status === "ACCEPTED" && row.preferredKitNumber2 != null
        ? row.preferredKitNumber2
        : "",
    signed:
      row.status === "ACCEPTED" && row.signatureDataUrl.startsWith("data:image/")
        ? "Yes"
        : "No",
  }));

  return writeWorkbook(
    "Club offers",
    "Jackals VC — Club offer responses",
    columns,
    rows,
  );
}

export async function buildCoachOfferResponsesWorkbook(
  responses: CoachOfferResponseRecord[],
) {
  const columns = [
    { key: "submittedAt", header: "Submitted", width: 20 },
    { key: "status", header: "Status", width: 12 },
    { key: "team", header: "Team", width: 18 },
    { key: "fullName", header: "Full name", width: 24 },
    { key: "email", header: "Email", width: 28 },
    { key: "phoneNumber", header: "Phone", width: 16 },
    { key: "poloMaterial", header: "Polo material", width: 14 },
    { key: "poloSize", header: "Polo size", width: 12 },
    { key: "signed", header: "Signed", width: 10 },
  ];

  const rows = responses.map((row) => ({
    submittedAt: formatDateTime(row.createdAt),
    status: statusLabel(row.status),
    team: row.teamLabel,
    fullName: row.fullName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    poloMaterial:
      row.status === "ACCEPTED" && row.poloMaterial
        ? coachPoloMaterialLabel(row.poloMaterial)
        : "",
    poloSize: row.status === "ACCEPTED" ? row.poloSize : "",
    signed:
      row.status === "ACCEPTED" && row.signatureDataUrl.startsWith("data:image/")
        ? "Yes"
        : "No",
  }));

  return writeWorkbook(
    "Coach offers",
    "Jackals VC — Coach offer responses",
    columns,
    rows,
  );
}

export function clubOfferExportFilename(now = new Date()) {
  return `jackals-vc-club-offer-responses-${now.toISOString().slice(0, 10)}.xlsx`;
}

export function coachOfferExportFilename(now = new Date()) {
  return `jackals-vc-coach-offer-responses-${now.toISOString().slice(0, 10)}.xlsx`;
}
