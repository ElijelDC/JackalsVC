import "server-only";

import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  formatMatchdayRoleLabel,
  type MatchdaySheetData,
  type MatchdaySheetEntry,
} from "@/lib/matchday-sheet-config";
import { normalizeSignupStatus, resolveCoachAttendanceStatus } from "@/lib/training-attendance-config";
import { formatMatchDateTime, formatMatchTitle } from "@/lib/match-config";
import { prisma } from "@/lib/prisma";
import { getTrainingTeamByKey } from "@/lib/training-squads";

export type { MatchdaySheetData, MatchdaySheetEntry } from "@/lib/matchday-sheet-config";

function isIncludedOnMatchdaySheet(
  rosterRole: string,
  status: ReturnType<typeof normalizeSignupStatus>,
) {
  if (status === "NOT_ATTENDING") return false;
  if (rosterRole === "COACH") return true;
  return status === "ATTENDING";
}

function sortSheetEntries(entries: MatchdaySheetEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.role === "COACH" || right.role === "COACH") {
      return left.name.localeCompare(right.name);
    }

    const leftNumber = left.playerNumber ?? Number.POSITIVE_INFINITY;
    const rightNumber = right.playerNumber ?? Number.POSITIVE_INFINITY;
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
    return left.name.localeCompare(right.name);
  });
}

export async function getMatchdaySheet(
  matchId: string,
  coachUserId: string,
): Promise<MatchdaySheetData> {
  const match = await prisma.teamMatch.findUnique({ where: { id: matchId } });
  if (!match) notFound();

  const coachMember = await prisma.clubMember.findFirst({
    where: {
      userId: coachUserId,
      rosterRole: "COACH",
      active: true,
      trainingTeamKey: match.trainingTeamKey,
    },
    select: { id: true },
  });
  if (!coachMember) notFound();

  const team = await getTrainingTeamByKey(match.trainingTeamKey);
  if (!team) notFound();

  const teammates = await prisma.clubMember.findMany({
    where: {
      trainingTeamKey: match.trainingTeamKey,
      active: true,
      userId: { not: null },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const signups = await prisma.matchSignup.findMany({
    where: { matchId },
    select: { userId: true, status: true },
  });
  const signupMap = new Map(
    signups.map((signup) => [
      signup.userId,
      normalizeSignupStatus(signup.status),
    ]),
  );

  const players: MatchdaySheetEntry[] = [];
  const coaches: MatchdaySheetEntry[] = [];

  for (const member of teammates) {
    if (!member.user) continue;

    const rawStatus = signupMap.get(member.user.id) ?? "UNANSWERED";
    const status =
      member.rosterRole === "COACH"
        ? resolveCoachAttendanceStatus(rawStatus, match.matchStart)
        : rawStatus;
    if (!isIncludedOnMatchdaySheet(member.rosterRole, status)) continue;

    const entry: MatchdaySheetEntry = {
      name: member.user.name,
      vlyNumber: member.vlyNumber,
      playerNumber: member.playerNumber,
      vlyMembershipPhotoUrl: member.vlyMembershipPhotoUrl,
      role: member.rosterRole === "COACH" ? "COACH" : "PLAYER",
    };

    if (entry.role === "COACH") {
      coaches.push(entry);
    } else {
      players.push(entry);
    }
  }

  return {
    match: {
      id: match.id,
      title: formatMatchTitle(match.opponentName, match.venue),
      opponentName: match.opponentName,
      venue: match.venue,
      location: match.location,
      warmUpTime: match.warmUpTime.toISOString(),
      matchStart: match.matchStart.toISOString(),
      cancelled: match.cancelled,
    },
    team: {
      key: team.key,
      name: team.name,
    },
    players: sortSheetEntries(players),
    coaches: sortSheetEntries(coaches),
  };
}

export function formatMatchdaySheetFilename(data: MatchdaySheetData) {
  const dateLabel = format(new Date(data.match.matchStart), "yyyy-MM-dd");
  const teamSlug = data.team.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `matchday-${teamSlug}-${dateLabel}.html`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function absoluteAssetUrl(origin: string, url: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${origin}${url}`;
}

function renderEntryCard(
  entry: MatchdaySheetEntry,
  origin: string,
) {
  const photoUrl = absoluteAssetUrl(origin, entry.vlyMembershipPhotoUrl);
  const numberLabel = formatMatchdayRoleLabel(entry);

  return `
    <article class="card">
      <div class="photo">
        ${
          photoUrl
            ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(entry.name)} VLY membership photo" />`
            : `<div class="photo-placeholder">No photo</div>`
        }
      </div>
      <div class="meta">
        <p class="name">${escapeHtml(entry.name)}</p>
        <p class="vly">${escapeHtml(entry.vlyNumber ?? "VLY pending")}</p>
        <p class="number">${escapeHtml(numberLabel)}</p>
      </div>
    </article>
  `;
}

function renderSection(
  title: string,
  entries: MatchdaySheetEntry[],
  origin: string,
) {
  if (entries.length === 0) return "";

  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      <div class="grid">
        ${entries.map((entry) => renderEntryCard(entry, origin)).join("")}
      </div>
    </section>
  `;
}

export function buildMatchdaySheetHtml(
  data: MatchdaySheetData,
  origin: string,
) {
  const { dateLabel, timeLabel } = formatMatchDateTime(
    data.match.warmUpTime,
    data.match.matchStart,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(data.match.title)} · ${escapeHtml(data.team.name)} matchday sheet</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Arial, Helvetica, sans-serif;
    }
    body {
      margin: 0;
      padding: 24px;
      background: #fff;
      color: #111;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
    }
    .subtitle {
      margin: 0 0 4px;
      color: #444;
    }
    .meta-line {
      margin: 0 0 24px;
      color: #666;
      font-size: 14px;
    }
    .section + .section {
      margin-top: 28px;
    }
    .section h2 {
      margin: 0 0 12px;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #555;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 16px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .photo {
      aspect-ratio: 3 / 4;
      background: #f4f4f4;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .photo-placeholder {
      color: #888;
      font-size: 12px;
      text-align: center;
      padding: 12px;
    }
    .meta {
      padding: 10px 12px 12px;
    }
    .name {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 700;
    }
    .vly {
      margin: 0 0 2px;
      font-size: 12px;
      color: #a33;
      font-family: monospace;
    }
    .number {
      margin: 0;
      font-size: 12px;
      color: #444;
    }
    @media print {
      body { padding: 12px; }
      .grid { gap: 12px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(data.match.title)}</h1>
    <p class="subtitle">${escapeHtml(data.team.name)}</p>
    <p class="meta-line">${escapeHtml(dateLabel)} · ${escapeHtml(timeLabel)} · ${escapeHtml(data.match.location)}</p>
  </header>
  ${renderSection("Players", data.players, origin)}
  ${renderSection("Coaches", data.coaches, origin)}
</body>
</html>`;
}
