import "server-only";

import ExcelJS from "exceljs";
import {
  TRIALS_APPLICATION_STATUS_LABELS,
  type TrialsApplicationRecord,
} from "@/lib/trials-application-config";
import {
  trialsInlDivisionLabel,
  trialsPositionLabel,
  trialsTeamLabel,
} from "@/lib/trials-recruitment-config";

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

const COLUMNS: Array<{
  key: keyof ReturnType<typeof toExportRow>;
  header: string;
  width: number;
}> = [
  { key: "submittedAt", header: "Submitted", width: 20 },
  { key: "status", header: "Status", width: 12 },
  { key: "tryingOutFor", header: "Trying out for", width: 22 },
  { key: "fullName", header: "Full name", width: 24 },
  { key: "age", header: "Age", width: 8 },
  { key: "contactEmail", header: "Email", width: 28 },
  { key: "contactNumber", header: "Phone", width: 16 },
  { key: "yearsExperience", header: "Years experience", width: 16 },
  { key: "preferredPosition1", header: "Position 1", width: 14 },
  { key: "preferredPosition2", header: "Position 2", width: 14 },
  { key: "inlDivision", header: "INL division 25/26", width: 18 },
  { key: "inlDivisionOther", header: "INL division (other)", width: 20 },
  { key: "inlTeamName", header: "INL team", width: 22 },
  { key: "reviewedAt", header: "Reviewed at", width: 20 },
];

function formatDateTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toExportRow(application: TrialsApplicationRecord) {
  return {
    submittedAt: formatDateTime(application.createdAt),
    status: TRIALS_APPLICATION_STATUS_LABELS[application.status],
    tryingOutFor: trialsTeamLabel(application.tryingOutFor),
    fullName: application.fullName,
    age: application.age,
    contactEmail: application.contactEmail,
    contactNumber: application.contactNumber,
    yearsExperience: application.yearsExperience,
    preferredPosition1: trialsPositionLabel(application.preferredPosition1),
    preferredPosition2: trialsPositionLabel(application.preferredPosition2),
    inlDivision: trialsInlDivisionLabel(application.inlDivision),
    inlDivisionOther: application.inlDivisionOther ?? "",
    inlTeamName: application.inlTeamName ?? "",
    reviewedAt: formatDateTime(application.reviewedAt),
  };
}

export async function buildTrialsApplicationsWorkbook(
  applications: TrialsApplicationRecord[],
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jackals VC";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet("Trials applications", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  sheet.columns = COLUMNS.map((column) => ({
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

  const rows = applications.map(toExportRow);
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
    to: { row: Math.max(1, rows.length + 1), column: COLUMNS.length },
  };

  const summary = workbook.addWorksheet("Summary");
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 14;

  summary.addRow(["Jackals VC — Trials applications"]);
  summary.getRow(1).font = { bold: true, size: 14, color: { argb: "FFB91C1C" } };
  summary.addRow(["Exported", new Date().toLocaleString("en-IE")]);
  summary.addRow(["Total applications", applications.length]);
  summary.addRow([]);
  summary.addRow(["By status", "Count"]).font = { bold: true };

  const byStatus = new Map<string, number>();
  const byTeam = new Map<string, number>();
  for (const application of applications) {
    const status = TRIALS_APPLICATION_STATUS_LABELS[application.status];
    const team = trialsTeamLabel(application.tryingOutFor);
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

export function trialsExportFilename(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10);
  return `jackals-vc-trials-applications-${stamp}.xlsx`;
}
