import {
  buildMatchdaySheetHtml,
  formatMatchdaySheetFilename,
  getMatchdaySheet,
} from "@/lib/matchday-sheet";
import { requireCoach } from "@/lib/coach-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { id } = await context.params;
  const data = await getMatchdaySheet(id, coach!.userId);
  const origin = new URL(request.url).origin;
  const html = buildMatchdaySheetHtml(data, origin);
  const filename = formatMatchdaySheetFilename(data);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
