import { NextRequest, NextResponse } from "next/server";
import { getBriefingApiOrigin } from "@/lib/briefing-api-base";

function ymdOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function formatDayLabel(dateYmd: string): string {
  const [y, m, day] = dateYmd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export async function GET(request: NextRequest) {
  const days = Math.min(14, Math.max(1, Number(request.nextUrl.searchParams.get("days")) || 5));
  const lang = request.nextUrl.searchParams.get("lang") === "hi" ? "hi" : "en";
  const ensureDigest = request.nextUrl.searchParams.get("fill") === "1";

  const base = getBriefingApiOrigin(request);
  const dates: string[] = [];
  for (let i = 0; i < days; i++) dates.push(ymdOffset(i));

  try {
    const results: {
      date: string;
      dayLabel: string;
      day_summary: unknown;
      sections: unknown[];
      digestReady: boolean;
      error?: string;
    }[] = [];

    for (const date of dates) {
      const url = `${base}/api/figma-daily-digest?date=${encodeURIComponent(date)}&lang=${lang}&ensureDigest=${ensureDigest ? "1" : "0"}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        results.push({
          date,
          dayLabel: formatDayLabel(date),
          error: typeof data.error === "string" ? data.error : "Feed error",
          day_summary: null,
          sections: [],
          digestReady: false,
        });
        continue;
      }
      const sections = Array.isArray(data.sections) ? data.sections : [];
      results.push({
        date,
        dayLabel: formatDayLabel(date),
        day_summary: data.day_summary ?? null,
        sections,
        digestReady: Boolean(data.digestReady),
      });
    }

    return NextResponse.json({ lang, days: results });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const unreachable =
      /fetch failed|ECONNREFUSED|ENOTFOUND|network/i.test(raw) ||
      raw === "Failed to fetch";
    const error = unreachable
      ? `Briefing API unreachable (${base}). Check NEWS_API_KEY and logs.`
      : raw;
    return NextResponse.json(
      {
        error,
        hint: "AI News Briefing runs in this app; see .env.example.",
        days: [],
      },
      { status: 502 }
    );
  }
}
