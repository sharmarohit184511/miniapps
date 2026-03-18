import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getNewsApiKey } from "@/lib/news/news-key";
import { NewsApiError } from "@/lib/news/newsapi";
import { fetchFigmaDayArticles, pickBriefingUrlsFromDay } from "@/lib/figma-digest/fetch-day-articles";
import { createBriefing } from "@/lib/db/briefings";
import { briefingQueue, isQueueAvailable } from "@/lib/queue/client";
import { runPipeline } from "@/lib/pipeline/run";
import type { TtsProvider } from "@/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  let body: { date?: string; ttsProvider?: string };
  try {
    body = (await request.json()) as { date?: string; ttsProvider?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const date = (body.date?.trim() || todayYmd()).slice(0, 10);
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date (use YYYY-MM-DD)" }, { status: 400 });
  }

  const apiKey = getNewsApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "NEWS_API_KEY not set" }, { status: 503 });
  }

  let sections: Awaited<ReturnType<typeof fetchFigmaDayArticles>>;
  try {
    sections = await fetchFigmaDayArticles(apiKey, date);
  } catch (e) {
    if (e instanceof NewsApiError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }

  const picked = pickBriefingUrlsFromDay(sections, 12);
  if (picked.length === 0) {
    return NextResponse.json(
      { error: "No article URLs for this date — try another day or check NewsAPI." },
      { status: 400 }
    );
  }

  const sources = picked.map((p) => ({
    type: "url" as const,
    value: p.url,
    briefing_section: p.sectionTitle,
  }));

  const ttsProvider: TtsProvider =
    body.ttsProvider === "microsoft" ? "microsoft" : "elevenlabs";

  const briefingId = await createBriefing(sources, ttsProvider, "en");
  if (!briefingId) {
    return NextResponse.json({ error: "Failed to create briefing" }, { status: 500 });
  }

  /**
   * Mini-apps feed polls until audio is ready. Queuing without a worker leaves users
   * loading forever. Always run the pipeline inline for this route (same as manual
   * generate when BRIEFING_USE_QUEUE=false). Set BRIEFING_FIGMA_DAY_USE_QUEUE=1 to
   * enqueue instead (only if workers process briefing-pipeline).
   */
  const useQueue =
    process.env.BRIEFING_FIGMA_DAY_USE_QUEUE === "1" ||
    process.env.BRIEFING_FIGMA_DAY_USE_QUEUE === "true";
  if (useQueue && isQueueAvailable() && briefingQueue) {
    await briefingQueue.add("process", { briefingId });
    return NextResponse.json({ briefingId, queued: true, date });
  }

  after(() => {
    runPipeline(briefingId).catch((err) => {
      console.error("[figma-day-briefing pipeline]", briefingId, err);
    });
  });
  return NextResponse.json({ briefingId, queued: false, date });
}
